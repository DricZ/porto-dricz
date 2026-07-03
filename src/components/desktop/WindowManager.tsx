import { lazy, Suspense } from "react"
import { Window } from "@/components/desktop/Window"
import { useWindows } from "@/stores/useWindowStore"
import type { AppId } from "@/types"

const TerminalApp = lazy(() => import("@/components/apps/TerminalApp").then((m) => ({ default: m.TerminalApp })))
const FilesApp = lazy(() => import("@/components/apps/FilesApp").then((m) => ({ default: m.FilesApp })))
const SettingsApp = lazy(() => import("@/components/apps/SettingsApp").then((m) => ({ default: m.SettingsApp })))
const ChromeApp = lazy(() => import("@/components/apps/ChromeApp").then((m) => ({ default: m.ChromeApp })))
const CalculatorApp = lazy(() => import("@/components/apps/CalculatorApp").then((m) => ({ default: m.CalculatorApp })))
const MediaPlayerApp = lazy(() => import("@/components/apps/MediaPlayerApp").then((m) => ({ default: m.MediaPlayerApp })))

const APP_COMPONENTS: Record<AppId, React.LazyExoticComponent<React.ComponentType>> = {
  terminal: TerminalApp,
  files: FilesApp,
  settings: SettingsApp,
  chrome: ChromeApp,
  calculator: CalculatorApp,
  mediaplayer: MediaPlayerApp,
}

function WindowFallback() {
  return (
    <div className="flex h-full items-center justify-center bg-[#2b2b2b]">
      <div className="size-5 animate-spin rounded-full border-2 border-white/20 border-t-white/80" />
    </div>
  )
}

export function WindowManager() {
  const windows = useWindows()

  if (windows.length === 0) return null

  return (
    <>
      {windows.map((win) => {
        const AppComponent = APP_COMPONENTS[win.appId]
        return (
          <Window key={win.id} window={win}>
            <Suspense fallback={<WindowFallback />}>
              {/* @ts-ignore */}
              <AppComponent window={win} />
            </Suspense>
          </Window>
        )
      })}
    </>
  )
}
