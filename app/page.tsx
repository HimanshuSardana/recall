import type { CSSProperties } from "react";
import { ChatProvider } from "@/components/chat-provider";
import { CommandPalette } from "@/components/command-palette";
import { ChatSurface } from "@/components/chat-surface";
import { Sidebar } from "@/components/sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function Home() {
  return (
    <ChatProvider>
      <SidebarProvider
        className="h-svh overflow-hidden font-sans"
        style={{ "--sidebar-width-icon": "2rem" } as CSSProperties}
      >
        <Sidebar />
        <SidebarInset className="relative flex flex-col bg-background transition-colors duration-150 md:ml-0!">
          <a
            href="#"
            className="absolute top-3 right-3 z-10 inline-flex h-7 items-center rounded-full bg-primary px-3 text-[12px] font-medium text-primary-foreground transition-[color,background-color,transform] duration-150 hover:bg-primary/90 active:scale-[0.97]"
          >
            Log In
          </a>
          <ChatSurface />
        </SidebarInset>
      </SidebarProvider>
      <CommandPalette />
    </ChatProvider>
  );
}
