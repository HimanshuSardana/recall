"use client";

import { ArrowUp, Check, ChevronDown, Mic, Plus } from "lucide-react";
import { type KeyboardEvent, useState } from "react";
import { useChat } from "@/components/chat-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function Composer({ className }: { className?: string }) {
  const { send, streaming, models, model, setModel } = useChat();
  const [prompt, setPrompt] = useState("");
  const selected = models.find((option) => option.id === model);

  const submit = () => {
    if (!prompt.trim() || streaming) return;
    void send(prompt);
    setPrompt("");
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  return (
    <div
      className={cn(
        "w-full rounded-[20px] bg-card p-2 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_10px_24px_-18px_rgba(0,0,0,0.15)] transition-[background-color,box-shadow] duration-150 ease-out has-focus-visible:ring-2 has-focus-visible:ring-ring/40",
        className,
      )}
    >
      <Textarea
        rows={2}
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
        onKeyDown={onKeyDown}
        placeholder="How can I help you today?"
        className="min-h-[52px] resize-none border-0 bg-transparent px-2 py-1.5 text-[14px] shadow-none placeholder:text-muted-foreground/80 dark:bg-transparent focus-visible:ring-0"
      />
      <div className="flex items-center justify-between px-0.5 pb-0.5">
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Add attachment"
          className="rounded-full border-border bg-card text-foreground shadow-sm hover:bg-accent"
        >
          <Plus strokeWidth={1.8} />
        </Button>
        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="sm"
                  className="group gap-1 pr-1 pl-1.5 text-[12px] font-medium text-foreground hover:bg-accent"
                />
              }
            >
              {selected?.label ?? "Model"}
              <ChevronDown
                className="size-3 text-muted-foreground transition-transform duration-150 ease-out group-aria-expanded:rotate-180"
                strokeWidth={1.8}
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-auto min-w-44">
              {models.length === 0 && (
                <DropdownMenuItem disabled className="text-[13px]">
                  No models available
                </DropdownMenuItem>
              )}
              {models.map((option) => (
                <DropdownMenuItem
                  key={option.id}
                  className="gap-2 text-[13px]"
                  onClick={() => setModel(option.id)}
                >
                  <span className="truncate">{option.label}</span>
                  {option.id === model && (
                    <Check className="ml-auto size-3.5 text-muted-foreground" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Voice input"
            className="rounded-full text-foreground hover:bg-accent"
          >
            <Mic strokeWidth={1.7} />
          </Button>
          <Button
            size="icon-sm"
            aria-label="Send"
            onClick={submit}
            disabled={!prompt.trim() || streaming}
            className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-foreground/10 disabled:text-foreground/40 disabled:opacity-100"
          >
            <ArrowUp strokeWidth={2} />
          </Button>
        </div>
      </div>
    </div>
  );
}
