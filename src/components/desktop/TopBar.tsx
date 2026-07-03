import { memo, useCallback, useEffect, useState } from "react"
import { LayoutGrid } from "lucide-react"
import { QuickSettings } from "@/components/desktop/QuickSettings"

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date)
}

export const TopBar = memo(function TopBar() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <header
      id="top-bar"
      className="flex h-7 w-full items-center justify-between bg-black/90 px-4 text-xs text-white shadow-sm select-none z-50"
    >
      <div className="flex items-center gap-2 font-medium opacity-90 hover:opacity-100 transition-opacity cursor-pointer">
        <LayoutGrid size={14} />
        <span>Apps</span>
      </div>

      <time suppressHydrationWarning className="absolute left-1/2 -translate-x-1/2 font-medium tracking-wide cursor-default">
        {formatDateTime(now)}
      </time>

      <div className="flex items-center gap-3">
        <QuickSettings />
      </div>
    </header>
  )
})
