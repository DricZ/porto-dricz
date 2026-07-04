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

  // The booting state is now controlled by the BootScreen component itself
  // which will call setAppState("login") when it's done booting.

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex h-dvh w-screen flex-col overflow-hidden relative">
        {/* SEO Visually Hidden Content */}
        <section className="sr-only">
          <h1>Dricz - Fullstack Developer Portfolio</h1>
          <p>
            Welcome to the interactive Ubuntu-style portfolio of Dricz. I am a Fullstack Developer
            specializing in modern web technologies including React, Next.js, Node.js, and TypeScript.
          </p>
          <h2>My Projects</h2>
          <p>
            Explore my latest web development projects, applications, and experiments.
            I build scalable, performant, and accessible web applications.
          </p>
          <h2>Skills & Expertise</h2>
          <p>
            Frontend: React, Next.js, Tailwind CSS, TypeScript.
            Backend: Node.js, PostgreSQL, Prisma, Express.
          </p>
        </section>

        {appState === "booting" && <BootScreen onBootComplete={() => setAppState("login")} />}
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
