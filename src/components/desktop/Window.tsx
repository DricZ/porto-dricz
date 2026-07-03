import { memo, useCallback, useEffect, useState } from "react"
import { useDrag } from "@/hooks/useDrag"
import { useWindowActions } from "@/stores/useWindowStore"
import { cn } from "@/lib/utils"
import type { WindowState } from "@/types"

interface WindowProps {
  window: WindowState
  children: React.ReactNode
}

export const Window = memo(function Window({
  window: win,
  children,
}: WindowProps) {
  const {
    closeWindow,
    minimizeWindow,
    maximizeWindow,
    focusWindow,
    updatePosition,
    updateSize,
  } = useWindowActions()
  const [isMobile, setIsMobile] = useState(false)
  const [size, setSize] = useState(win.size)

  useEffect(() => {
    setSize(win.size)
  }, [win.size.width, win.size.height])

  useEffect(() => {
    const mq = globalThis.matchMedia("(max-width: 767px)")
    setIsMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  const handleDragEnd = useCallback(
    (position: { x: number; y: number }) => {
      updatePosition(win.id, position)
    },
    [win.id, updatePosition]
  )

  const { elRef, dragHandleProps, dragContainerProps } = useDrag({
    position: win.position,
    onDragEnd: handleDragEnd,
  })

  const handleClose = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      closeWindow(win.id)
    },
    [win.id, closeWindow]
  )

  const handleMinimize = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      minimizeWindow(win.id)
    },
    [win.id, minimizeWindow]
  )

  const handleMaximize = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      maximizeWindow(win.id)
    },
    [win.id, maximizeWindow]
  )

  const handleFocus = useCallback(() => {
    focusWindow(win.id)
  }, [win.id, focusWindow])

  const handleResizePointerDown = (e: React.PointerEvent, dir: "right" | "bottom" | "br") => {
    e.stopPropagation()
    const startX = e.clientX
    const startY = e.clientY
    const startWidth = size.width
    const startHeight = size.height

    // We can also disable drag temporarily or just focus the window
    focusWindow(win.id)

    const handlePointerMove = (moveEvent: PointerEvent) => {
      let newWidth = startWidth
      let newHeight = startHeight

      if (dir === "right" || dir === "br") {
        newWidth = Math.max(300, startWidth + (moveEvent.clientX - startX))
      }
      if (dir === "bottom" || dir === "br") {
        newHeight = Math.max(200, startHeight + (moveEvent.clientY - startY))
      }

      setSize({ width: newWidth, height: newHeight })
      updateSize(win.id, { width: newWidth, height: newHeight })
    }

    const handlePointerUp = () => {
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerup", handlePointerUp)
    }

    window.addEventListener("pointermove", handlePointerMove)
    window.addEventListener("pointerup", handlePointerUp)
  }

  if (win.isMinimized) return null

  const isFullscreen = isMobile || win.isMaximized

  const windowContent = (
    <div
      className={cn(
        "window-shell relative flex flex-col overflow-hidden rounded-xl border border-white/10 bg-[#2b2b2b] shadow-2xl",
        isFullscreen && "!rounded-none !border-0"
      )}
      style={
        isFullscreen
          ? { width: "100%", height: "100%", position: "absolute", inset: 0 }
          : { width: size.width, height: size.height }
      }
      onPointerDown={handleFocus}
    >
      {/* Title bar */}
      <div
        className={cn(
          "window-title-bar flex h-9 shrink-0 items-center gap-2 bg-[#303030] px-3 select-none",
          !isFullscreen && "cursor-grab active:cursor-grabbing"
        )}
        onDoubleClick={handleMaximize}
        {...(!isFullscreen ? dragHandleProps : {})}
      >
        {/* Traffic lights — Ubuntu style (left side) */}
        <div
          className="flex items-center gap-1.5"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button
            id={`window-close-${win.id}`}
            onPointerDown={handleClose}
            className="size-3 rounded-full bg-[#E95420] transition-opacity hover:opacity-80"
            aria-label="Close"
          />
          <button
            id={`window-minimize-${win.id}`}
            onPointerDown={handleMinimize}
            className="size-3 rounded-full bg-[#F5A623] transition-opacity hover:opacity-80"
            aria-label="Minimize"
          />
          <button
            id={`window-maximize-${win.id}`}
            onPointerDown={handleMaximize}
            className="size-3 rounded-full bg-[#4CAF50] transition-opacity hover:opacity-80"
            aria-label="Maximize"
          />
        </div>

        <span className="flex-1 truncate text-center text-xs font-medium text-white/70">
          {win.title}
        </span>

        {/* Spacer to keep title centered */}
        <div className="w-[42px]" />
      </div>

      {/* Window content */}
      <div className="flex-1 overflow-hidden">{children}</div>

      {/* Resize handles */}
      {!isFullscreen && (
        <>
          <div 
            className="absolute top-0 right-0 bottom-0 w-1.5 cursor-e-resize z-50 hover:bg-white/10 transition-colors"
            onPointerDown={(e) => handleResizePointerDown(e, "right")}
          />
          <div 
            className="absolute bottom-0 left-0 right-0 h-1.5 cursor-s-resize z-50 hover:bg-white/10 transition-colors"
            onPointerDown={(e) => handleResizePointerDown(e, "bottom")}
          />
          <div 
            className="absolute bottom-0 right-0 w-3 h-3 cursor-se-resize z-50"
            onPointerDown={(e) => handleResizePointerDown(e, "br")}
          />
        </>
      )}
    </div>
  )

  if (isFullscreen) {
    return (
      <div className="absolute inset-0" style={{ zIndex: win.zIndex }}>
        {windowContent}
      </div>
    )
  }

  return (
    <div
      ref={elRef}
      className="absolute"
      style={{
        zIndex: win.zIndex,
        transform: `translate(${win.position.x}px, ${win.position.y}px)`,
      }}
      {...dragContainerProps}
    >
      {windowContent}
    </div>
  )
})
