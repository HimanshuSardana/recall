"use client";

/* eslint-disable @next/next/no-img-element -- local previews are blob URLs, not optimizable assets */

import { ArrowUp, Check, ChevronDown, FileText, ImagePlus, Mic, Plus, X } from "lucide-react";
import { type DragEvent, type KeyboardEvent, useRef, useState } from "react";
import { useChat } from "@/components/chat-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const MAX_ATTACHMENTS = 5;
const MAX_BYTES = 10 * 1024 * 1024;

type Attachment = {
  id: string;
  file: File;
  url?: string;
};

function extension(name: string) {
  const dot = name.lastIndexOf(".");
  return dot === -1 ? "file" : name.slice(dot + 1);
}

export function Composer({ className }: { className?: string }) {
  const { send, streaming, models, model, setModel } = useChat();
  const [prompt, setPrompt] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [rejected, setRejected] = useState("");
  const [dragging, setDragging] = useState(false);
  const images = useRef<HTMLInputElement>(null);
  const documents = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const selected = models.find((option) => option.id === model);
  const full = attachments.length >= MAX_ATTACHMENTS;

  const add = (list: FileList | null) => {
    if (!list?.length) return;

    const accepted = Array.from(list).filter((file) => file.size <= MAX_BYTES);
    const oversize = list.length - accepted.length;
    setRejected(oversize ? `${oversize} file(s) over 10 MB were skipped` : "");

    setAttachments((previous) =>
      [
        ...previous,
        ...accepted.map((file) => ({
          id: crypto.randomUUID(),
          file,
          url: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
        })),
      ].slice(0, MAX_ATTACHMENTS),
    );
  };

  const remove = (attachment: Attachment) => {
    if (attachment.url) URL.revokeObjectURL(attachment.url);
    setAttachments((previous) => previous.filter((item) => item.id !== attachment.id));
  };

  const submit = () => {
    if ((!prompt.trim() && attachments.length === 0) || streaming) return;
    void send(prompt, attachments.map((attachment) => attachment.file));
    attachments.forEach((attachment) => attachment.url && URL.revokeObjectURL(attachment.url));
    setAttachments([]);
    setRejected("");
    setPrompt("");
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  const onDragOver = (event: DragEvent<HTMLDivElement>) => {
    if (!event.dataTransfer.types.includes("Files")) return;
    event.preventDefault();
  };

  return (
    <div
      className={cn(
        "relative w-full rounded-[20px] bg-card p-2 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_10px_24px_-18px_rgba(0,0,0,0.15)] transition-[background-color,box-shadow] duration-150 ease-out has-focus-visible:ring-2 has-focus-visible:ring-ring/40",
        className,
      )}
      onDragEnter={(event) => {
        if (!event.dataTransfer.types.includes("Files")) return;
        event.preventDefault();
        dragDepth.current += 1;
        setDragging(true);
      }}
      onDragOver={onDragOver}
      onDragLeave={() => {
        dragDepth.current -= 1;
        if (dragDepth.current <= 0) {
          dragDepth.current = 0;
          setDragging(false);
        }
      }}
      onDrop={(event) => {
        event.preventDefault();
        dragDepth.current = 0;
        setDragging(false);
        if (!full) add(event.dataTransfer.files);
      }}
    >
      <input
        ref={images}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(event) => {
          add(event.target.files);
          event.target.value = "";
        }}
      />
      <input
        ref={documents}
        type="file"
        multiple
        hidden
        onChange={(event) => {
          add(event.target.files);
          event.target.value = "";
        }}
      />

      {dragging && (
        <div className="pointer-events-none absolute inset-0 z-10 grid animate-in fade-in-0 place-items-center rounded-[20px] border border-dashed border-ring/60 bg-card/85 text-[12px] text-muted-foreground duration-150">
          Drop to attach
        </div>
      )}

      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 px-1 pt-1 pb-2">
          {attachments.map((attachment) => (
            <figure
              key={attachment.id}
              className="group w-16 animate-in fade-in-0 zoom-in-95 duration-150 ease-out"
            >
              <div className="relative size-16 overflow-hidden rounded-xl border border-border bg-background">
                {attachment.url ? (
                  <img
                    src={attachment.url}
                    alt={attachment.file.name}
                    className="size-full object-cover"
                  />
                ) : (
                  <span className="grid size-full place-items-center text-muted-foreground">
                    <FileText className="size-5" strokeWidth={1.6} />
                  </span>
                )}
                <span className="absolute bottom-1 left-1 rounded bg-card/90 px-1 text-[9px] font-medium tracking-wide text-muted-foreground uppercase">
                  {extension(attachment.file.name)}
                </span>
                <button
                  type="button"
                  aria-label={`Remove ${attachment.file.name}`}
                  onClick={() => remove(attachment)}
                  className="absolute top-1 right-1 grid size-4 place-items-center rounded-full bg-black/55 text-white opacity-0 transition-opacity duration-150 group-hover:opacity-100 focus-visible:opacity-100"
                >
                  <X className="size-3" strokeWidth={2.2} />
                </button>
              </div>
              <figcaption className="mt-1 truncate text-[10px] text-muted-foreground">
                {attachment.file.name}
              </figcaption>
            </figure>
          ))}
        </div>
      )}

      {rejected && (
        <p className="px-2 pb-1 text-[11px] text-muted-foreground">{rejected}</p>
      )}

      <Textarea
        rows={2}
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
        onKeyDown={onKeyDown}
        placeholder="How can I help you today?"
        className="min-h-[52px] resize-none border-0 bg-transparent px-2 py-1.5 text-[14px] shadow-none placeholder:text-muted-foreground/80 dark:bg-transparent focus-visible:ring-0"
      />
      <div className="flex items-center justify-between px-0.5 pb-0.5">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="Add attachment"
                className="rounded-full border-border bg-card text-foreground shadow-sm hover:bg-accent"
              />
            }
          >
            <Plus strokeWidth={1.8} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="top" className="w-64">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-[11px]">Attach</DropdownMenuLabel>
              <DropdownMenuItem
                disabled={full}
                className="items-start gap-2.5 py-2 text-[13px]"
                onClick={() => images.current?.click()}
              >
                <ImagePlus className="mt-0.5 size-4 text-muted-foreground" strokeWidth={1.7} />
                <span className="flex flex-col">
                  Photos
                  <span className="text-[11px] text-muted-foreground">PNG, JPG, HEIC</span>
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={full}
                className="items-start gap-2.5 py-2 text-[13px]"
                onClick={() => documents.current?.click()}
              >
                <FileText className="mt-0.5 size-4 text-muted-foreground" strokeWidth={1.7} />
                <span className="flex flex-col">
                  Files
                  <span className="text-[11px] text-muted-foreground">PDF, CSV, ZIP</span>
                </span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <p className="border-t border-border px-1.5 pt-1.5 pb-0.5 text-[11px] text-muted-foreground">
              {full ? "Remove one to add another" : "…or drop them on the composer"}
            </p>
          </DropdownMenuContent>
        </DropdownMenu>

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
            disabled={(!prompt.trim() && attachments.length === 0) || streaming}
            className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-foreground/10 disabled:text-foreground/40 disabled:opacity-100"
          >
            <ArrowUp strokeWidth={2} />
          </Button>
        </div>
      </div>
    </div>
  );
}
