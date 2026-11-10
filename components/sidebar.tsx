import {
  BookText,
  Ellipsis,
  Folder,
  Plug,
  Search,
  Settings,
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

type Chat = { title: string; active?: boolean };

const nav = [
  { label: "New chat", icon: SquarePen },
  { label: "Library", icon: BookText },
  { label: "Projects", icon: Folder },
  { label: "Plugins", icon: Plug },
];

const sections: { label: string; chats: Chat[] }[] = [
  {
    label: "Pinned",
    chats: [
      { title: "Review Q3 Support Report", active: true },
      { title: "Onboarding IT Checklist" },
    ],
  },
  {
    label: "Today",
    chats: [
      { title: "VPN Not Connecting" },
      { title: "Reset My Okta MFA" },
      { title: "Slack Notifications Issue" },
    ],
  },
  {
    label: "Yesterday",
    chats: [
      { title: "Wi-Fi Keeps Disconnecting" },
      { title: "Request Jira Access" },
    ],
  },
  {
    label: "Previous week",
    chats: [
      { title: "MacBook Running Slowly" },
      { title: "Set Up New Monitor" },
      { title: "GitHub Access Request" },
      { title: "Password Reset Help" },
      { title: "Install Figma Desktop" },
      { title: "Zoom Camera Not Working" },
      { title: "Connect to Office Printer" },
      { title: "Update macOS Safely" },
      { title: "Recover Deleted File" },
    ],
  },
];

export function Sidebar() {
  return (
    <SidebarShell variant="inset" collapsible="icon">
      <SidebarHeader className="flex-row items-center gap-2 px-1.5 pt-1 pb-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
        <svg
          viewBox="0 0 12 14"
          className="h-3.5 w-3 shrink-0 fill-[#171716] group-data-[collapsible=icon]:hidden"
        >
          <path d="M1 1h10L6.8 7 11 13H1l4.2-6z" />
        </svg>
        <span className="text-[12.5px] font-semibold tracking-tight text-[#171716] group-data-[collapsible=icon]:hidden">
          Kraken
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Search"
          className="ml-auto text-[#8a8880] hover:bg-black/5 group-data-[collapsible=icon]:hidden"
        >
          <Search strokeWidth={1.7} />
        </Button>
        <SidebarTrigger className="text-[#8a8880] hover:bg-black/5" />
      </SidebarHeader>

      <SidebarContent className="px-1">
        <SidebarGroup className="p-1">
          <SidebarMenu>
            {nav.map(({ label, icon: Icon }) => (
              <SidebarMenuItem key={label}>
                <SidebarMenuButton
                  className="h-7 gap-2 px-2 text-[12px] font-normal text-[#55534f] hover:bg-black/5"
                  tooltip={label}
                >
                  <Icon className="text-[#8a8880]" strokeWidth={1.7} />
                  {label}
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <div className="group-data-[collapsible=icon]:hidden">
          {sections.map(({ label, chats }) => (
            <SidebarGroup key={label} className="p-1">
              <SidebarGroupLabel className="h-6 px-2 text-[10.5px] font-semibold text-[#2b2b28]">
                {label}
              </SidebarGroupLabel>
              <SidebarMenu>
                {chats.map((chat) => (
                  <SidebarMenuItem key={chat.title}>
                    <SidebarMenuButton
                      isActive={chat.active}
                      className="h-6.5 gap-2 px-2 text-[12px] font-normal text-[#6f6e6a] hover:bg-black/5 data-active:font-normal data-active:text-[#1c1c1a]"
                    >
                      <span className="truncate">{chat.title}</span>
                      {chat.active && (
                        <Ellipsis className="ml-auto size-3.5 shrink-0 text-[#a9a7a2]" />
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          ))}
        </div>
      </SidebarContent>

      <SidebarFooter className="flex-row items-center gap-2 border-t border-black/5 px-3 py-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:border-0 group-data-[collapsible=icon]:px-0">
        <Avatar size="sm" className="size-5 shrink-0">
          <AvatarFallback className="bg-[#2b2b28] text-[9px] font-medium text-white">
            ME
          </AvatarFallback>
        </Avatar>
        <span className="text-[12px] font-medium text-[#1c1c1a] group-data-[collapsible=icon]:hidden">
          Milo Eric
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Settings"
          className="ml-auto text-[#a9a7a2] hover:bg-black/5 group-data-[collapsible=icon]:hidden"
        >
          <Settings strokeWidth={1.7} />
        </Button>
      </SidebarFooter>
      <SidebarRail />
    </SidebarShell>
  );
}
