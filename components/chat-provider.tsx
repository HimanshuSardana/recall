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
  send: (text: string, files?: File[]) => Promise<void>;
};

const ChatContext = createContext<ChatContextValue | null>(null);

const readAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

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

    const send = async (text: string, files: File[] = []) => {
      const prompt = text.trim();
      if ((!prompt && files.length === 0) || streaming) return;

      const names = files.map((file) => file.name);
      const content = names.length
        ? [prompt, `Attached: ${names.join(", ")}`].filter(Boolean).join("\n\n")
        : prompt;

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
        .map(({ role, content: previous }) => ({ role, content: previous }));

      setChats(nextChats);
      setActiveId(chatId);
      setStreaming(true);

      if (!existing) {
        // Named from the first message while the reply streams; the provisional
        // title is already showing, so this only sharpens it.
        void fetch("/v1/chat/title", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: prompt || `Files: ${names.join(", ")}` }),
        })
          .then((response) => (response.ok ? response.json() : null))
          .then((payload: { title?: string } | null) => {
            const title = payload?.title?.trim();
            if (!title) return;
            setChats((previous) =>
              previous.map((chat) => (chat.id === chatId ? { ...chat, title } : chat)),
            );
          })
          .catch(() => {});
      }

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
        const imageParts = await Promise.all(
          files
            .filter((file) => file.type.startsWith("image/"))
            .map(async (file) => ({
              type: "image_url" as const,
              image_url: { url: await readAsDataUrl(file) },
            })),
        );

        const response = await fetch("/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: model || undefined,
            session_id: sessionId(),
            stream: true,
            messages: [
              ...history,
              {
                role: "user",
                content: imageParts.length
                  ? [{ type: "text", text: content }, ...imageParts]
                  : content,
              },
            ],
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
