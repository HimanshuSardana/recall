"use client";

import { useEffect, useRef } from "react";
import { Markdown } from "@/components/markdown";
import type { Message } from "@/lib/chat";

function AssistantMark() {
  return (
    <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
      <svg viewBox="0 0 12 14" className="h-3 w-2.5 fill-current">
        <path d="M1 1h10L6.8 7 11 13H1l4.2-6z" />
      </svg>
    </span>
  );
}

export function ChatThread({
  messages,
  streaming,
}: {
  messages: Message[];
  streaming: boolean;
}) {
  const end = useRef<HTMLDivElement>(null);
  const last = messages.at(-1);

  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [messages.length, last?.content]);

  return (
    <section className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-[720px] space-y-6 px-2 py-8">
        {messages.map((message) =>
          message.role === "user" ? (
            <div key={message.id} className="flex justify-end">
              <p className="max-w-[80%] rounded-2xl bg-card px-4 py-2.5 text-[14px] leading-relaxed whitespace-pre-wrap text-foreground shadow-sm">
                {message.content}
              </p>
            </div>
          ) : (
            <div key={message.id} className="flex gap-3">
              <AssistantMark />
              <div className="min-w-0 flex-1 pt-0.5">
                <Markdown>{message.content}</Markdown>
                {streaming && message.id === last?.id && (
                  <span className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 animate-pulse bg-foreground" />
                )}
              </div>
            </div>
          ),
        )}
        <div ref={end} />
      </div>
    </section>
  );
}
