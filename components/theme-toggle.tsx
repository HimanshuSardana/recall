"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="ml-auto text-muted-foreground hover:bg-accent group-data-[collapsible=icon]:hidden"
      onClick={() => {
        setDark(!dark);
        document.documentElement.classList.toggle("dark", !dark);
        localStorage.setItem("theme", dark ? "light" : "dark");
      }}
    >
      {dark ? <Sun strokeWidth={1.7} /> : <Moon strokeWidth={1.7} />}
    </Button>
  );
}
