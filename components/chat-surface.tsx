"use client";

import { useLayoutEffect, useRef } from "react";
import { useChat } from "@/components/chat-provider";
import { ChatThread } from "@/components/chat-thread";
import { Composer } from "@/components/composer";

const CURVE = "cubic-bezier(0.65, 0, 0.35, 1)";

export function ChatSurface() {
  const { activeChat, streaming, enteringChatId } = useChat();
  const messages = activeChat?.messages ?? [];
  const hero = messages.length === 0;

  const composer = useRef<HTMLDivElement>(null);
  const lastTop = useRef<number | null>(null);
  const lastHero = useRef(hero);

  useLayoutEffect(() => {
    const node = composer.current;
    if (!node) return;

    // Cancel first so the measurement is not taken mid-flight.
    node.getAnimations().forEach((animation) => animation.cancel());
    const top = node.getBoundingClientRect().top;
    const moved = lastTop.current !== null && lastHero.current !== hero;

    if (moved) {
      const delta = lastTop.current! - top;

      if (Math.abs(delta) > 1) {
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        if (reduced) {
          node.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 120, easing: "ease-out" });
        } else {
          node.animate([{ transform: `translateY(${delta}px)` }, { transform: "none" }], {
            duration: 240,
            easing: CURVE,
          });
        }
      }
    }

    lastTop.current = top;
    lastHero.current = hero;
  }, [hero]);

  return (
    <div
      className={
        hero
          ? "flex flex-1 flex-col items-center justify-center px-6"
          : "flex min-h-0 flex-1 flex-col px-6"
      }
    >
      {hero ? (
        <h1 className="mb-5 text-[28px] font-normal tracking-[-0.01em] text-foreground">
          Hello, Guest
        </h1>
      ) : (
        <ChatThread
          messages={messages}
          streaming={streaming}
          entering={activeChat?.id === enteringChatId}
        />
      )}

      <div
        ref={composer}
        className={hero ? "w-full max-w-[480px]" : "mx-auto w-full max-w-[720px] pb-4"}
      >
        <Composer />
      </div>
    </div>
  );
}
