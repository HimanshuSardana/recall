"use client";

/* eslint-disable @next/next/no-img-element -- stored thumbnails are data URLs, not optimizable assets */

import { FileText } from "lucide-react";
import { useEffect, useRef } from "react";
import { Markdown } from "@/components/markdown";
import type { Message, MessageAttachment } from "@/lib/chat";

function UserAttachments({ attachments }: { attachments: MessageAttachment[] }) {
  return (
    <div className="flex flex-wrap items-start gap-1.5">
      {attachments.map((attachment, index) =>
        attachment.thumbnail ? (
          <img
            key={`${attachment.name}-${index}`}
            src={attachment.thumbnail}
            alt={attachment.name}
            title={attachment.name}
            className="max-h-52 w-auto max-w-[260px] rounded-lg object-cover"
          />
        ) : (
          <span
            key={`${attachment.name}-${index}`}
            className="inline-flex max-w-[240px] items-center gap-1.5 rounded-md border border-border px-2 py-1 text-[11px] text-muted-foreground"
          >
            <FileText className="size-3.5 shrink-0" strokeWidth={1.7} />
            <span className="truncate">{attachment.name}</span>
          </span>
        ),
      )}
    </div>
  );
}

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
              <div
                className={
                  message.attachments?.length
                    ? "flex max-w-[80%] flex-col gap-2 rounded-2xl bg-card p-1.5 text-[14px] leading-relaxed text-foreground shadow-sm"
                    : "max-w-[80%] rounded-2xl bg-card px-4 py-2.5 text-[14px] leading-relaxed text-foreground shadow-sm"
                }
              >
                {message.attachments?.length ? (
                  <UserAttachments attachments={message.attachments} />
                ) : null}
                {message.content && (
                  <p className="px-2.5 pb-1 whitespace-pre-wrap">{message.content}</p>
                )}
              </div>
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
