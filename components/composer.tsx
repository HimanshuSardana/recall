"use client";

import { ArrowUp, ChevronDown, Mic, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";

const models = ["Astra Max", "Astra Mini", "Kraken 1.5"];

export function Composer() {
  return (
    <div className="w-full max-w-[480px] rounded-[20px] bg-card p-2 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_10px_24px_-18px_rgba(0,0,0,0.15)]">
      <Textarea
        rows={2}
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
                  className="gap-1 pr-1 pl-1.5 text-[12px] font-medium text-foreground hover:bg-accent"
                />
              }
            >
              Astra Max
              <ChevronDown className="size-3 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-auto min-w-36">
              {models.map((model) => (
                <DropdownMenuItem key={model} className="text-[13px]">
                  {model}
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
            className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <ArrowUp strokeWidth={2} />
          </Button>
        </div>
      </div>
    </div>
  );
}
