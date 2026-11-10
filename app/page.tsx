import { Button } from "@/components/ui/button";
import { Composer } from "@/components/composer";
import { Sidebar } from "@/components/sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function Home() {
  return (
    <SidebarProvider className="h-svh overflow-hidden font-sans">
      <Sidebar />
      <SidebarInset className="relative items-center justify-center bg-[#efedec] px-6">
        <Button className="absolute top-3 right-3 h-7 rounded-full bg-[#171716] px-3 text-[12px] font-medium text-white hover:bg-[#2b2b28]">
          Get Pro
        </Button>
        <h1 className="mb-5 text-[28px] font-normal tracking-[-0.01em] text-[#1c1c1a]">
          Hello, Milo
        </h1>
        <Composer />
      </SidebarInset>
    </SidebarProvider>
  );
}
