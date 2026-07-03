import { memo, useCallback } from "react"
import { cn } from "@/lib/utils"
import type { AppId } from "@/types"

interface DesktopIconProps {
  id: string
  label: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  isSelected: boolean
  onSelect: (id: string) => void
  onOpen: (appId: AppId) => void
  appId: AppId | null
}

export const DesktopIcon = memo(function DesktopIcon({
  id,
  label,
  icon: Icon,
  isSelected,
  onSelect,
  onOpen,
  appId,
}: DesktopIconProps) {
  const handleClick = useCallback(() => {
    onSelect(id)
    if (window.innerWidth < 640 && appId) {
      onOpen(appId)
    }
  }, [id, onSelect, appId, onOpen])

  const handleDoubleClick = useCallback(() => {
    if (appId) {
      onOpen(appId)
    }
  }, [appId, onOpen])

  return (
    <button
      id={`desktop-icon-${id}`}
      className={cn(
        "flex w-16 sm:w-20 flex-col items-center gap-1 sm:gap-1.5 rounded-lg p-1.5 sm:p-2 transition-colors",
        "hover:bg-white/10 active:bg-white/20",
        isSelected && "bg-white/20 ring-1 ring-white/30",
      )}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      <Icon className="size-8 sm:size-10 text-white drop-shadow-md" />
      <span className="max-w-full truncate text-[10px] sm:text-xs font-medium text-white drop-shadow-md">
        {label}
      </span>
    </button>
  )
})
