import { useCallback, useState, useEffect } from "react"
import {
  Briefcase,
  Calculator,
  FolderOpen,
  Globe,
  Home,
  Music,
  Settings,
  TerminalSquare,
  Mail,
} from "lucide-react"
import { DesktopIcon } from "@/components/desktop/DesktopIcon"
import { WindowManager } from "@/components/desktop/WindowManager"
import { useWindowActions } from "@/stores/useWindowStore"
import { useSession } from "@/lib/auth-client"
import { getSettings } from "@/app/actions/cms"
import type { AppId } from "@/types"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"

export const DESKTOP_ICONS = [
  { id: "files", label: "Files", icon: FolderOpen, appId: "files" as AppId },
  { id: "portfolios", label: "My Portofolios", icon: Briefcase, appId: "files" as AppId },
  { id: "terminal", label: "Terminal", icon: TerminalSquare, appId: "terminal" as AppId },
  { id: "chrome", label: "Chrome", icon: Globe, appId: "chrome" as AppId },
  { id: "calculator", label: "Calculator", icon: Calculator, appId: "calculator" as AppId },
  { id: "mediaplayer", label: "Music", icon: Music, appId: "mediaplayer" as AppId },
  { id: "contact", label: "Contact", icon: Mail, appId: "contact" as AppId },
  { id: "settings", label: "Settings", icon: Settings, appId: "settings" as AppId },
] as const

export function DesktopArea() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const { openWindow } = useWindowActions()
  const { data: session } = useSession()
  const [wallpaper, setWallpaper] = useState<string>("/wallpaper.png")

  useEffect(() => {
    let mounted = true
    getSettings().then((settings) => {
      if (!mounted) return
      const wp = (settings as any).wallpaper
      if (wp) {
        setWallpaper(wp)
      }
    }).catch(err => console.error(err))
    
    const handleWallpaperChange = (e: Event) => {
      const customEvent = e as CustomEvent<string>
      setWallpaper(customEvent.detail)
    }
    
    window.addEventListener("wallpaperChanged", handleWallpaperChange)
    return () => {
      mounted = false
      window.removeEventListener("wallpaperChanged", handleWallpaperChange)
    }
  }, [])

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id)
  }, [])

  const handleOpen = useCallback(
    (appId: AppId, initialData?: any) => {
      openWindow(appId, initialData)
    },
    [openWindow],
  )

  const handleDesktopClick = useCallback(() => {
    setSelectedId(null)
  }, [])

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <main
          id="desktop-area"
          className="desktop-wallpaper relative flex-1 overflow-hidden"
          style={{ backgroundImage: `url("${wallpaper}")` }}
          onClick={handleDesktopClick}
        >
          {/* Desktop icons grid */}
          <div
            className="absolute left-2 right-2 top-2 sm:right-auto sm:left-4 sm:top-4 grid grid-cols-4 sm:grid-cols-1 gap-1 sm:gap-2 justify-items-center sm:justify-items-start"
            onClick={(e) => e.stopPropagation()}
          >
            {DESKTOP_ICONS.map(({ id, label, icon, appId }) => {
              const initialData = id === "portfolios" ? { directory: "Portofolio" } : undefined
              return (
                <DesktopIcon
                  key={id}
                  id={id}
                  label={label}
                  icon={icon}
                  isSelected={selectedId === id}
                  onSelect={() => handleSelect(id)}
                  onOpen={() => appId && handleOpen(appId, initialData)}
                  appId={appId}
                />
              )
            })}
          </div>

          {/* Window Manager */}
          <WindowManager />
        </main>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-64 bg-[#2b2b2b]/95 text-white/90 border-white/10 backdrop-blur-md shadow-2xl p-1 rounded-lg text-sm">
        <ContextMenuItem className="hover:bg-white/10 focus:bg-white/10 focus:text-white cursor-default py-1.5 px-3 rounded-md transition-colors" onClick={() => openWindow("files")}>
          Show Desktop in Files
        </ContextMenuItem>
        <ContextMenuItem className="hover:bg-white/10 focus:bg-white/10 focus:text-white cursor-default py-1.5 px-3 rounded-md transition-colors" onClick={() => openWindow("terminal")}>
          Open in Terminal
        </ContextMenuItem>
        
        {session && (
          <>
            <ContextMenuSeparator className="bg-white/10 my-1" />
            <ContextMenuItem className="hover:bg-white/10 focus:bg-white/10 focus:text-white cursor-default py-1.5 px-3 rounded-md transition-colors" onClick={() => openWindow("settings")}>
              Change Background...
            </ContextMenuItem>
            <ContextMenuItem className="hover:bg-white/10 focus:bg-white/10 focus:text-white cursor-default py-1.5 px-3 rounded-md transition-colors" onClick={() => openWindow("settings")}>
              Display Settings
            </ContextMenuItem>
          </>
        )}

        <ContextMenuSeparator className="bg-white/10 my-1" />
        <ContextMenuItem className="hover:bg-white/10 focus:bg-white/10 focus:text-white cursor-default py-1.5 px-3 rounded-md transition-colors" onClick={() => openWindow("settings")}>
          Settings
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
