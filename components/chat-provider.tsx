"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  type Chat,
  type Message,
  loadChats,
  newId,
  saveChats,
  sessionId,
  startOfDay,
  titleFrom,
} from "@/lib/chat";

type ModelOption = { id: string; label: string };

type ChatContextValue = {
  chats: Chat[];
  activeChat: Chat | null;
  dayStart: number;
  streaming: boolean;
  models: ModelOption[];
  model: string;
  setModel: (id: string) => void;
  startNewChat: () => void;
  openChat: (id: string) => void;
  send: (text: string) => Promise<void>;
};

const ChatContext = createContext<ChatContextValue | null>(null);

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) throw new Error("useChat must be used inside <ChatProvider>");
  return context;
}

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [dayStart, setDayStart] = useState(0);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [models, setModels] = useState<ModelOption[]>([]);
  const [model, setModelState] = useState("");

  useEffect(() => {
    // localStorage is only readable on the client, so the first paint has no
    // history to show. Hydrating the store here is the point of the effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setChats(loadChats());
    setDayStart(startOfDay(new Date()));
    setLoaded(true);
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetch("/v1/models")
      .then((response) => response.json())
      .then((payload: { data?: { id: string; name?: string }[] }) => {
        if (cancelled) return;

        const options = (payload.data ?? []).map((entry) => ({
          id: entry.id,
          label: entry.name ?? entry.id,
        }));
        if (options.length === 0) return;

        const saved = localStorage.getItem("kraken.model");
        setModels(options);
        setModelState(
          options.some((option) => option.id === saved) ? saved! : options[0].id,
        );
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const timer = setTimeout(() => saveChats(chats), 250);
    return () => clearTimeout(timer);
  }, [chats, loaded]);

  const value = useMemo<ChatContextValue>(() => {
    const activeChat = chats.find((chat) => chat.id === activeId) ?? null;

    const appendToAssistant = (chatId: string, messageId: string, content: string) =>
      setChats((previous) =>
        previous.map((chat) =>
          chat.id === chatId
            ? {
                ...chat,
                messages: chat.messages.map((message) =>
                  message.id === messageId ? { ...message, content } : message,
                ),
              }
            : chat,
        ),
      );

    const send = async (text: string) => {
      const content = text.trim();
      if (!content || streaming) return;

      const now = Date.now();
      const userMessage: Message = { id: newId(), role: "user", content };
      const existing = activeChat;
      const chatId = existing?.id ?? newId();

      const nextChats = existing
        ? chats.map((chat) =>
            chat.id === chatId
              ? {
                  ...chat,
                  messages: [...chat.messages, userMessage],
                  updatedAt: now,
                  title: chat.messages.length ? chat.title : titleFrom(content),
                }
              : chat,
          )
        : [
            {
              id: chatId,
              title: titleFrom(content),
              messages: [userMessage],
              createdAt: now,
              updatedAt: now,
            },
            ...chats,
          ];

      const history = (existing?.messages ?? [])
        .filter((message) => message.content)
        .map(({ role, content: text }) => ({ role, content: text }));

      setChats(nextChats);
      setActiveId(chatId);
      setStreaming(true);

      const assistantId = newId();
      setChats((previous) =>
        previous.map((chat) =>
          chat.id === chatId
            ? {
                ...chat,
                messages: [
                  ...chat.messages,
                  { id: assistantId, role: "assistant" as const, content: "" },
                ],
              }
            : chat,
        ),
      );

      try {
        const response = await fetch("/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: model || undefined,
            session_id: sessionId(),
            stream: true,
            messages: [...history, { role: "user", content }],
          }),
        });

        if (!response.ok || !response.body) {
          throw new Error(`The assistant responded with ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let reply = "";

        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const events = buffer.split("\n\n");
          buffer = events.pop() ?? "";

          for (const event of events) {
            const line = event.trim();
            if (!line.startsWith("data:")) continue;

            const payload = line.slice(5).trim();
            if (payload === "[DONE]") continue;

            const delta = JSON.parse(payload).choices?.[0]?.delta?.content;
            if (!delta) continue;

            reply += delta;
            appendToAssistant(chatId, assistantId, reply);
          }
        }

        setChats((previous) =>
          previous.map((chat) =>
            chat.id === chatId ? { ...chat, updatedAt: Date.now() } : chat,
          ),
        );
      } catch (error) {
        appendToAssistant(
          chatId,
          assistantId,
          error instanceof Error ? error.message : "Something went wrong.",
        );
      } finally {
        setStreaming(false);
      }
    };

    return {
      chats,
      activeChat,
      dayStart,
      streaming,
      models,
      model,
      setModel: (id: string) => {
        setModelState(id);
        localStorage.setItem("kraken.model", id);
      },
      startNewChat: () => setActiveId(null),
      openChat: (id: string) => setActiveId(id),
      send,
    };
  }, [chats, activeId, dayStart, streaming, models, model]);

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}
