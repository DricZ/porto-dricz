"use client"

import { useState, useEffect } from "react"
import { TooltipProvider } from "@/components/ui/tooltip"
import { TopBar } from "@/components/desktop/TopBar"
import { Dock } from "@/components/desktop/Dock"
import { DesktopArea } from "@/components/desktop/DesktopArea"
import { BootScreen } from "@/components/desktop/BootScreen"
import { LockScreen } from "@/components/desktop/LockScreen"

export default function Home() {
  const [appState, setAppState] = useState<"booting" | "login" | "desktop">("booting")

  useEffect(() => {
    if (appState === "booting") {
      const timer = setTimeout(() => {
        setAppState("login")
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [appState])

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex h-dvh w-screen flex-col overflow-hidden relative">
        {appState === "booting" && <BootScreen />}
        {appState === "login" && <LockScreen onUnlock={() => setAppState("desktop")} />}
        
        <TopBar />
        <div className="relative flex flex-1 overflow-hidden">
          <DesktopArea />
          <Dock />
        </div>
      </div>
    </TooltipProvider>
  )
}
