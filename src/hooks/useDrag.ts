import { useCallback, useRef } from "react"

interface Position {
  x: number
  y: number
}

interface UseDragOptions {
  position: Position
  onDragEnd: (position: Position) => void
}

export function useDrag({ position, onDragEnd }: UseDragOptions) {
  const dragging = useRef(false)
  const offset = useRef({ x: 0, y: 0 })
  const current = useRef(position)
  const elRef = useRef<HTMLDivElement | null>(null)

  // Keep position ref in sync
  current.current = position

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      // Only left mouse button
      if (e.button !== 0) return
      e.preventDefault()

      dragging.current = true
      offset.current = {
        x: e.clientX - current.current.x,
        y: e.clientY - current.current.y,
      }

      const el = elRef.current
      if (el) {
        el.setPointerCapture(e.nativeEvent.pointerId)
      }
    },
    [],
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging.current || !elRef.current) return

      const x = e.clientX - offset.current.x
      const y = e.clientY - offset.current.y

      // Direct DOM manipulation for smooth dragging (no re-render per pixel)
      elRef.current.style.transform = `translate(${x}px, ${y}px)`
      current.current = { x, y }
    },
    [],
  )

  const handlePointerUp = useCallback(
    () => {
      if (!dragging.current) return
      dragging.current = false
      onDragEnd(current.current)
    },
    [onDragEnd],
  )

  return {
    elRef,
    dragHandleProps: {
      onPointerDown: handlePointerDown,
    },
    dragContainerProps: {
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
    },
  }
}
