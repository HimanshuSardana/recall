"use client";

import {
  BookText,
  Ellipsis,
  Folder,
  Plug,
  Search,
  SquarePen,
} from "lucide-react";
import {
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
  Sidebar as SidebarShell,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useChat } from "@/components/chat-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { groupChats } from "@/lib/chat";

const nav = [
  { label: "New chat", icon: SquarePen },
  { label: "Library", icon: BookText },
  { label: "Projects", icon: Folder },
  { label: "Plugins", icon: Plug },
];

export function Sidebar() {
  const { chats, activeChat, dayStart, openChat, startNewChat } = useChat();
  const groups = groupChats(chats, dayStart);

  return (
    <SidebarShell variant="inset" collapsible="icon">
      <SidebarHeader className="h-9 flex-row items-center gap-2 pr-1.5 pl-4 py-0 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
        <svg
          viewBox="0 0 12 14"
          className="h-3.5 w-3 shrink-0 fill-foreground group-data-[collapsible=icon]:hidden"
        >
          <path d="M1 1h10L6.8 7 11 13H1l4.2-6z" />
        </svg>
        <span className="text-[12.5px] leading-none font-semibold tracking-tight text-foreground group-data-[collapsible=icon]:hidden">
          Kraken
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Search"
          className="ml-auto size-7 text-muted-foreground hover:bg-accent group-data-[collapsible=icon]:hidden"
        >
          <Search strokeWidth={1.7} />
        </Button>
        <SidebarTrigger className="size-7 text-muted-foreground hover:bg-accent" />
      </SidebarHeader>

      <SidebarContent className="px-1 [mask-image:linear-gradient(to_bottom,black,black_calc(100%-28px),transparent)] group-data-[collapsible=icon]:px-0">
        <SidebarGroup className="p-1 group-data-[collapsible=icon]:p-0">
          <SidebarMenu>
            {nav.map(({ label, icon: Icon }) => (
              <SidebarMenuItem key={label}>
                <SidebarMenuButton
                  className="h-7 gap-2 px-2 text-[12px] font-normal text-foreground/80"
                  tooltip={label}
                  onClick={label === "New chat" ? startNewChat : undefined}
                >
                  <Icon className="text-muted-foreground" strokeWidth={1.7} />
                  {label}
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <div className="pb-8 transition-[opacity,visibility] duration-150 ease-out group-data-[collapsible=icon]:invisible group-data-[collapsible=icon]:opacity-0">
          {groups.length === 0 && (
            <p className="px-3 pt-6 text-[11.5px] leading-relaxed text-muted-foreground">
              No chats yet. Ask something and it will show up here.
            </p>
          )}
          {groups.map(({ label, chats: items }) => (
            <SidebarGroup key={label} className="p-1">
              <SidebarGroupLabel className="h-6 px-2 text-[10.5px] font-semibold text-foreground">
                {label}
              </SidebarGroupLabel>
              <SidebarMenu>
                {items.map((chat) => (
                  <SidebarMenuItem key={chat.id}>
                    <SidebarMenuButton
                      isActive={chat.id === activeChat?.id}
                      className="h-6.5 gap-2 px-2 text-[12px] font-normal text-muted-foreground data-active:font-normal data-active:text-foreground"
                      onClick={() => openChat(chat.id)}
                    >
                      <span className="truncate">{chat.title}</span>
                      {chat.id === activeChat?.id && (
                        <Ellipsis className="ml-auto size-3.5 shrink-0 text-muted-foreground/70" />
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          ))}
        </div>
      </SidebarContent>

      <SidebarFooter className="flex-row items-center gap-2 px-3 py-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
        <Avatar size="sm" className="size-5 shrink-0">
          <AvatarFallback className="bg-primary text-[9px] font-medium text-primary-foreground">
            GU
          </AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
          <p className="truncate text-[12px] font-medium text-foreground">
            Guest User
          </p>
          <a
            href="#"
            className="text-[11px] text-muted-foreground underline-offset-2 transition-colors duration-150 hover:text-foreground hover:underline"
          >
            Log In
          </a>
        </div>
        <ThemeToggle />
      </SidebarFooter>
      <SidebarRail />
    </SidebarShell>
  );
}
