"use client";

import { Command } from "cmdk";
import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useChat } from "@/components/chat-provider";

/** A window of the message around the first match, so a hit deep in a long
 *  reply still shows why it matched. */
function excerpt(content: string, query: string) {
  const text = content.replace(/\s+/g, " ").trim();
  const at = query ? text.toLowerCase().indexOf(query.toLowerCase()) : -1;
  const from = at > 40 ? at - 40 : 0;
  const slice = text.slice(from, from + 150);
  return `${from > 0 ? "…" : ""}${slice}${from + 150 < text.length ? "…" : ""}`;
}

export function CommandPalette() {
  const { searchOpen, setSearchOpen } = useChat();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(!searchOpen);
        return;
      }

      if (event.key === "Escape" && searchOpen) {
        event.preventDefault();
        setSearchOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [searchOpen, setSearchOpen]);

  if (!searchOpen) return null;

  return <Palette />;
}

function Palette() {
  const { chats, openChat, setSearchOpen } = useChat();
  const [query, setQuery] = useState("");

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  const groups = useMemo(
    () =>
      chats
        .map((chat) => ({
          id: chat.id,
          title: chat.title,
          hits: chat.messages.filter((message) => message.content.trim()),
        }))
        .filter((group) => group.hits.length > 0),
    [chats],
  );

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40"
      onClick={() => setSearchOpen(false)}
      role="presentation"
    >
      <div
        className="mx-auto mt-[12vh] w-[min(92vw,560px)] overflow-hidden rounded-xl bg-popover text-popover-foreground shadow-[0_16px_48px_-12px_rgba(0,0,0,0.3)] ring-1 ring-foreground/10"
        onClick={(event) => event.stopPropagation()}
      >
        <Command label="Search messages" shouldFilter loop>
          <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
            <Search className="size-3.5 shrink-0 text-muted-foreground" strokeWidth={2} />
            <Command.Input
              autoFocus
              value={query}
              onValueChange={setQuery}
              placeholder="Search your messages…"
              className="w-full bg-transparent text-[14px] text-foreground outline-none placeholder:text-muted-foreground"
            />
            <kbd className="shrink-0 rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">
              ⌘K
            </kbd>
          </div>

          <Command.List className="max-h-[52vh] overflow-y-auto p-1.5 [scrollbar-width:thin]">
            <Command.Empty className="px-3 py-8 text-center text-[12.5px] text-muted-foreground">
              {chats.length === 0
                ? "No chats yet. Ask something and its messages become searchable."
                : `No message matches “${query}”.`}
            </Command.Empty>

            {groups.map((group) => (
              <Command.Group
                key={group.id}
                heading={group.title}
                className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-[10.5px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:uppercase"
              >
                {group.hits.map((message) => (
                  <Command.Item
                    key={`${group.id}-${message.id}`}
                    value={`${group.title} ${message.content}`}
                    onSelect={() => openChat(group.id)}
                    className="group flex cursor-pointer items-start gap-2 rounded-lg px-2 py-1.5 text-[13px] text-muted-foreground outline-none data-[selected=true]:bg-accent data-[selected=true]:text-foreground"
                  >
                    <span
                      aria-hidden="true"
                      className="mt-0.5 grid size-4 shrink-0 place-items-center rounded bg-muted text-[8px] font-medium uppercase"
                    >
                      {message.role === "user" ? "you" : "ai"}
                    </span>
                    <span className="min-w-0 flex-1 leading-relaxed">
                      {excerpt(message.content, query)}
                    </span>
                  </Command.Item>
                ))}
              </Command.Group>
            ))}
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
