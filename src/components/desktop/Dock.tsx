import { memo, useCallback } from "react"
import {
  Calculator,
  FolderOpen,
  Globe,
  Music,
  Settings,
  TerminalSquare,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useOpenAppIds, useWindowActions } from "@/stores/useWindowStore"
import { cn } from "@/lib/utils"
import type { AppId } from "@/types"

interface DockItem {
  appId: AppId
  label: string
  icon: LucideIcon
}

const DOCK_ITEMS: DockItem[] = [
  { appId: "terminal", label: "Terminal", icon: TerminalSquare },
  { appId: "files", label: "Files", icon: FolderOpen },
  { appId: "chrome", label: "Chrome", icon: Globe },
  { appId: "calculator", label: "Calculator", icon: Calculator },
  { appId: "mediaplayer", label: "Media Player", icon: Music },
  { appId: "settings", label: "Settings", icon: Settings },
]

export const Dock = memo(function Dock() {
  const openAppIds = useOpenAppIds()
  const { openWindow } = useWindowActions()

  const handleClick = useCallback(
    (appId: AppId) => {
      openWindow(appId)
    },
    [openWindow]
  )

  return (
    <nav
      id="dock"
      className="absolute bottom-2 left-1/2 z-50 flex max-w-[calc(100vw-1rem)] -translate-x-1/2 items-center gap-1 rounded-xl border border-white/10 bg-[#1e1e1e]/80 px-2 py-1.5 shadow-2xl backdrop-blur-xl sm:bottom-4 sm:gap-2 sm:rounded-2xl sm:px-3 sm:py-2"
    >
      {DOCK_ITEMS.map(({ appId, label, icon: Icon }) => {
        const isOpen = openAppIds.includes(appId)
        return (
          <Tooltip key={appId}>
            <TooltipTrigger asChild>
              <button
                id={`dock-${appId}`}
                onClick={() => handleClick(appId)}
                className={cn(
                  "relative flex size-10 items-center justify-center rounded-lg transition-all duration-200 sm:size-12 sm:rounded-xl",
                  "hover:bg-white/10 active:scale-95",
                  isOpen && "bg-white/10"
                )}
                aria-label={`Open ${label}`}
              >
                <Icon className="text-white/90" size={20} strokeWidth={1.5} />
                {isOpen ? (
                  <span className="absolute bottom-0.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-blue-500 sm:bottom-1 sm:size-1.5" />
                ) : null}
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={8}>
              {label}
            </TooltipContent>
          </Tooltip>
        )
      })}
    </nav>
  )
})
