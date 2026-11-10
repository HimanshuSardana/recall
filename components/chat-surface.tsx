"use client";

import { useChat } from "@/components/chat-provider";
import { ChatThread } from "@/components/chat-thread";
import { Composer } from "@/components/composer";

export function ChatSurface() {
  const { activeChat, streaming } = useChat();
  const messages = activeChat?.messages ?? [];

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6">
        <h1 className="mb-5 text-[28px] font-normal tracking-[-0.01em] text-foreground">
          Hello, Guest
        </h1>
        <Composer className="max-w-[480px]" />
      </div>
    );
  }

  return (
    <>
      <ChatThread messages={messages} streaming={streaming} />
      <div className="px-6 pb-4">
        <Composer className="mx-auto max-w-[720px]" />
      </div>
    </>
  );
}
