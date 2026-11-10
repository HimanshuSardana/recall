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
import { ThemeToggle } from "@/components/theme-toggle";

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
    <SidebarShell
      variant="inset"
      collapsible="icon"
      className="transition-colors duration-150"
    >
      <SidebarHeader className="flex-row items-center gap-2 px-1.5 pt-1 pb-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
        <svg
          viewBox="0 0 12 14"
          className="h-3.5 w-3 shrink-0 fill-foreground group-data-[collapsible=icon]:hidden"
        >
          <path d="M1 1h10L6.8 7 11 13H1l4.2-6z" />
        </svg>
        <span className="text-[12.5px] font-semibold tracking-tight text-foreground group-data-[collapsible=icon]:hidden">
          Kraken
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Search"
          className="ml-auto text-muted-foreground hover:bg-accent group-data-[collapsible=icon]:hidden"
        >
          <Search strokeWidth={1.7} />
        </Button>
        <SidebarTrigger className="text-muted-foreground hover:bg-accent" />
      </SidebarHeader>

      <SidebarContent className="px-1 [mask-image:linear-gradient(to_bottom,black,black_calc(100%-28px),transparent)] group-data-[collapsible=icon]:px-0">
        <SidebarGroup className="p-1 group-data-[collapsible=icon]:p-0">
          <SidebarMenu>
            {nav.map(({ label, icon: Icon }) => (
              <SidebarMenuItem key={label}>
                <SidebarMenuButton
                  className="h-7 gap-2 px-2 text-[12px] font-normal text-foreground/80"
                  tooltip={label}
                >
                  <Icon className="text-muted-foreground" strokeWidth={1.7} />
                  {label}
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <div className="pb-8 transition-[opacity,visibility] duration-150 ease-out group-data-[collapsible=icon]:invisible group-data-[collapsible=icon]:opacity-0">
          {sections.map(({ label, chats }) => (
            <SidebarGroup key={label} className="p-1">
              <SidebarGroupLabel className="h-6 px-2 text-[10.5px] font-semibold text-foreground">
                {label}
              </SidebarGroupLabel>
              <SidebarMenu>
                {chats.map((chat) => (
                  <SidebarMenuItem key={chat.title}>
                    <SidebarMenuButton
                      isActive={chat.active}
                      className="h-6.5 gap-2 px-2 text-[12px] font-normal text-muted-foreground data-active:font-normal data-active:text-foreground"
                    >
                      <span className="truncate">{chat.title}</span>
                      {chat.active && (
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
            ME
          </AvatarFallback>
        </Avatar>
        <span className="text-[12px] font-medium text-foreground group-data-[collapsible=icon]:hidden">
          Milo Eric
        </span>
        <ThemeToggle />
      </SidebarFooter>
      <SidebarRail />
    </SidebarShell>
  );
}
