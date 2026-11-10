import type { CSSProperties } from "react";
import { Button } from "@/components/ui/button";
import { Composer } from "@/components/composer";
import { Sidebar } from "@/components/sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function Home() {
  return (
    <SidebarProvider
      className="h-svh overflow-hidden font-sans"
      style={{ "--sidebar-width-icon": "2rem" } as CSSProperties}
    >
      <Sidebar />
      <SidebarInset className="relative items-center justify-center bg-background px-6 transition-colors duration-150 md:ml-0!">
        <Button className="absolute top-3 right-3 h-7 rounded-full bg-primary px-3 text-[12px] font-medium text-primary-foreground hover:bg-primary/90">
          Get Pro
        </Button>
        <h1 className="mb-5 text-[28px] font-normal tracking-[-0.01em] text-foreground">
          Hello, Milo
        </h1>
        <Composer />
      </SidebarInset>
    </SidebarProvider>
  );
}
