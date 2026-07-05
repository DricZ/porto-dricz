import { memo, useCallback, useEffect, useState } from "react"
import { LayoutGrid, Calendar } from "lucide-react"
import { QuickSettings } from "@/components/desktop/QuickSettings"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { DESKTOP_ICONS } from "@/components/desktop/DesktopArea"
import { useWindowActions } from "@/stores/useWindowStore"
import { Separator } from "@/components/ui/separator"

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
  const { openWindow } = useWindowActions()

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <header
      id="top-bar"
      className="z-50 flex h-7 w-full items-center justify-between bg-black/90 px-4 text-xs text-white shadow-sm select-none"
    >
      <Popover>
        <PopoverTrigger asChild>
          <div className="flex cursor-pointer items-center gap-2 rounded-full px-2 py-0.5 font-medium opacity-90 transition-opacity hover:bg-white/10 hover:opacity-100">
            <LayoutGrid size={14} />
            <span>Apps</span>
          </div>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          sideOffset={8}
          className="w-64 rounded-xl border-white/10 bg-[#1e1e1e]/95 p-3 text-white shadow-2xl backdrop-blur-xl"
        >
          <div className="grid grid-cols-3 gap-2">
            {DESKTOP_ICONS.map((icon) => (
              <button
                key={icon.id}
                onClick={() => {
                  const initialData =
                    icon.id === "portfolios"
                      ? { directory: "Portfolio" }
                      : undefined
                  openWindow(icon.appId, initialData)
                }}
                className="flex flex-col items-center gap-2 rounded-lg p-2 transition-colors hover:bg-white/10"
              >
                <icon.icon className="size-6 text-white/80" />
                <span className="w-full truncate text-center text-[10px]">
                  {icon.label}
                </span>
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <time
            suppressHydrationWarning
            className="absolute left-1/2 -translate-x-1/2 cursor-pointer rounded-full px-3 py-0.5 font-medium tracking-wide opacity-90 transition-colors hover:bg-white/10 hover:opacity-100"
          >
            {formatDateTime(now)}
          </time>
        </PopoverTrigger>
        <PopoverContent
          className="w-80 rounded-xl border-white/10 bg-[#1e1e1e]/95 p-4 text-white shadow-2xl backdrop-blur-xl"
          align="center"
          sideOffset={8}
        >
          <div className="flex flex-col items-center">
            <h3 className="mb-4 text-lg font-medium">
              {now.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </h3>
            <div className="grid w-full grid-cols-7 gap-1 text-center text-sm">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                <div key={d} className="py-1 font-semibold text-white/50">
                  {d}
                </div>
              ))}
              {Array.from({ length: 42 }).map((_, i) => {
                const today = new Date()
                const firstDay = new Date(
                  today.getFullYear(),
                  today.getMonth(),
                  1
                ).getDay()
                const daysInMonth = new Date(
                  today.getFullYear(),
                  today.getMonth() + 1,
                  0
                ).getDate()
                const day = i - firstDay + 1
                const isCurrentMonth = day > 0 && day <= daysInMonth
                const isToday = isCurrentMonth && day === today.getDate()

                if (i >= firstDay + daysInMonth && i % 7 === 0) return null // hide 6th row if empty
                if (i >= 35 && day > daysInMonth) return null

                return (
                  <div
                    key={i}
                    className={`mx-auto flex size-8 items-center justify-center rounded-full p-1.5 ${isToday ? "bg-blue-500 font-bold text-white" : isCurrentMonth ? "cursor-pointer transition-colors hover:bg-white/10" : "text-transparent"}`}
                  >
                    {isCurrentMonth ? day : ""}
                  </div>
                )
              })}
            </div>

            <Separator className="my-4 bg-white/10" />

            <div className="w-full">
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-xs font-semibold tracking-wider text-white/50 uppercase">
                  Notifications
                </h4>
                <button className="text-[10px] text-white/40 transition-colors hover:text-white/80">
                  Clear
                </button>
              </div>
              <div className="flex flex-col items-center justify-center rounded-lg border border-white/5 bg-white/5 py-6 text-white/40">
                <p className="text-sm">No new notifications</p>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <div className="flex items-center gap-3">
        <QuickSettings />
      </div>
    </header>
  )
})
