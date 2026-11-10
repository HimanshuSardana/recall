"use client";

/* eslint-disable @next/next/no-img-element -- stored thumbnails are data URLs, not optimizable assets */

import { FileText } from "lucide-react";
import { useEffect, useRef } from "react";
import { Markdown } from "@/components/markdown";
import type { Message, MessageAttachment } from "@/lib/chat";

function UserAttachments({ attachments }: { attachments: MessageAttachment[] }) {
  const images = attachments.filter((attachment) => attachment.thumbnail);
  const files = attachments.filter((attachment) => !attachment.thumbnail);

  return (
    <div className="flex w-full flex-col gap-1.5">
      {images.length > 0 && (
        <div className={images.length > 1 ? "grid grid-cols-2 gap-1.5" : undefined}>
          {images.map((attachment, index) => (
            <img
              key={`${attachment.name}-${index}`}
              src={attachment.thumbnail}
              alt={attachment.name}
              title={attachment.name}
              className={
                images.length > 1
                  ? "aspect-square w-full rounded-lg object-cover"
                  : "max-h-52 w-full rounded-lg object-cover"
              }
            />
          ))}
        </div>
      )}

      {files.length > 0 && (
        <div className="flex flex-wrap items-start gap-1.5">
          {files.map((attachment, index) => (
            <span
              key={`${attachment.name}-${index}`}
              className="inline-flex max-w-[240px] items-center gap-1.5 rounded-md border border-border px-2 py-1 text-[11px] text-muted-foreground"
            >
              <FileText className="size-3.5 shrink-0" strokeWidth={1.7} />
              <span className="truncate">{attachment.name}</span>
            </span>
          ))}
        </div>
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
  entering = false,
}: {
  messages: Message[];
  streaming: boolean;
  entering?: boolean;
}) {
  const end = useRef<HTMLDivElement>(null);
  const last = messages.at(-1);

  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [messages.length, last?.content]);

  return (
    <section
      role="log"
      aria-live="polite"
      aria-relevant="additions text"
      aria-busy={streaming}
      className={[
        "min-h-0 flex-1 overflow-y-auto [scrollbar-width:thin] [scrollbar-color:var(--border)_transparent] [scrollbar-gutter:stable_both-edges]",
        entering ? "enter-thread" : "",
      ].join(" ")}
    >
      <div className="mx-auto w-full max-w-[720px] space-y-6 py-8">
        {messages.map((message) =>
          message.role === "user" ? (
            <div key={message.id} className="flex justify-end">
              <div
                className={
                  message.attachments?.length
                    ? "flex w-fit max-w-[80%] flex-col gap-2 rounded-2xl bg-card p-1.5 text-[14px] leading-relaxed text-foreground shadow-sm"
                    : "max-w-[80%] rounded-2xl bg-card px-4 py-2.5 text-[14px] leading-relaxed text-foreground shadow-sm"
                }
              >
                {message.attachments?.length ? (
                  <UserAttachments attachments={message.attachments} />
                ) : null}
                {message.content && (
                  <p
                    className={
                      message.attachments?.length
                        ? "px-2.5 pb-1 whitespace-pre-wrap"
                        : "whitespace-pre-wrap"
                    }
                  >
                    {message.content}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div key={message.id} className="flex gap-3">
              <AssistantMark />
              <div className="min-w-0 flex-1 pt-0.5">
                {message.content ? (
                  <Markdown streaming={streaming && message.id === last?.id}>
                    {message.content}
                  </Markdown>
                ) : (
                  streaming &&
                  message.id === last?.id && (
                    <span className="caret-block" aria-hidden="true" />
                  )
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
