import { create } from "zustand"
import { devtools } from "zustand/middleware"
import { useShallow } from "zustand/react/shallow"
import type { AppId, WindowState } from "@/types"

const APP_TITLES: Record<AppId, string> = {
  terminal: "Terminal",
  files: "Files",
  settings: "Settings",
  chrome: "Google Chrome",
  calculator: "Calculator",
  mediaplayer: "Media Player",
  pdfviewer: "Document Viewer",
  contact: "Contact Me",
}

const DEFAULT_SIZES: Record<AppId, { width: number; height: number }> = {
  terminal: { width: 720, height: 480 },
  files: { width: 800, height: 520 },
  settings: { width: 600, height: 400 },
  chrome: { width: 900, height: 600 },
  calculator: { width: 300, height: 400 },
  mediaplayer: { width: 700, height: 500 },
  pdfviewer: { width: 800, height: 600 },
  contact: { width: 450, height: 500 },
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 9)
}

function getSpawnPosition(existingCount: number): { x: number; y: number } {
  const offset = existingCount * 30
  return { x: 120 + offset, y: 60 + offset }
}

interface WindowStore {
  windows: WindowState[]
  nextZIndex: number

  openWindow: (appId: AppId, initialData?: any) => void
  closeWindow: (id: string) => void
  minimizeWindow: (id: string) => void
  maximizeWindow: (id: string) => void
  restoreWindow: (id: string) => void
  focusWindow: (id: string) => void
  updatePosition: (id: string, position: { x: number; y: number }) => void
  updateSize: (id: string, size: { width: number; height: number }) => void
}

export const useWindowStore = create<WindowStore>()(
  devtools(
    (set, get) => ({
      windows: [],
      nextZIndex: 1,

      openWindow: (appId, initialData) => {
        const { windows, nextZIndex } = get()

        const existing = windows.find((w) => w.appId === appId)
        if (existing) {
          if (existing.isMinimized) {
            get().restoreWindow(existing.id)
          } else {
            // Check if it's the focused window (highest zIndex among non-minimized windows)
            const activeWindows = windows.filter(w => !w.isMinimized)
            const isTopMost = activeWindows.length > 0 && 
              existing.zIndex === Math.max(...activeWindows.map(w => w.zIndex))
            
            if (isTopMost) {
              get().minimizeWindow(existing.id)
            } else {
              get().focusWindow(existing.id)
            }
          }
          return
        }

        const position = getSpawnPosition(windows.length)
        const size = DEFAULT_SIZES[appId] || { width: 800, height: 600 }

        const newWindow: WindowState = {
          id: generateId(),
          appId,
          title: APP_TITLES[appId],
          position,
          size,
          isMinimized: false,
          isMaximized: false,
          zIndex: nextZIndex,
          initialData,
        }

        set(
          (state) => ({
            windows: [...state.windows, newWindow],
            nextZIndex: state.nextZIndex + 1,
          }),
          undefined,
          "openWindow",
        )
      },

      closeWindow: (id) => {
        set(
          (state) => ({
            windows: state.windows.filter((w) => w.id !== id),
          }),
          undefined,
          "closeWindow",
        )
      },

      minimizeWindow: (id) => {
        set(
          (state) => ({
            windows: state.windows.map((w) =>
              w.id === id ? { ...w, isMinimized: true } : w,
            ),
          }),
          undefined,
          "minimizeWindow",
        )
      },

      maximizeWindow: (id) => {
        set(
          (state) => ({
            windows: state.windows.map((w) =>
              w.id === id
                ? { ...w, isMaximized: !w.isMaximized }
                : w,
            ),
          }),
          undefined,
          "maximizeWindow",
        )
      },

      restoreWindow: (id) => {
        const { nextZIndex } = get()
        set(
          (state) => ({
            windows: state.windows.map((w) =>
              w.id === id
                ? { ...w, isMinimized: false, zIndex: nextZIndex }
                : w,
            ),
            nextZIndex: state.nextZIndex + 1,
          }),
          undefined,
          "restoreWindow",
        )
      },

      focusWindow: (id) => {
        const { nextZIndex } = get()
        set(
          (state) => ({
            windows: state.windows.map((w) =>
              w.id === id ? { ...w, zIndex: nextZIndex } : w,
            ),
            nextZIndex: state.nextZIndex + 1,
          }),
          undefined,
          "focusWindow",
        )
      },

      updatePosition: (id, position) => {
        set(
          (state) => ({
            windows: state.windows.map((w) =>
              w.id === id ? { ...w, position } : w,
            ),
          }),
          undefined,
          "updatePosition",
        )
      },

      updateSize: (id, size) => {
        set(
          (state) => ({
            windows: state.windows.map((w) =>
              w.id === id ? { ...w, size } : w,
            ),
          }),
          undefined,
          "updateSize",
        )
      },
    }),
    { name: "window-store" },
  ),
)

// Selective subscription hooks — prevent unnecessary re-renders
export const useWindows = () => useWindowStore(useShallow((s) => s.windows))

export const useWindowActions = () =>
  useWindowStore(
    useShallow((s) => ({
      openWindow: s.openWindow,
      closeWindow: s.closeWindow,
      minimizeWindow: s.minimizeWindow,
      maximizeWindow: s.maximizeWindow,
      restoreWindow: s.restoreWindow,
      focusWindow: s.focusWindow,
      updatePosition: s.updatePosition,
      updateSize: s.updateSize,
    })),
  )

export const useActiveAppIds = () =>
  useWindowStore(
    useShallow((s) =>
      s.windows.filter((w) => !w.isMinimized).map((w) => w.appId),
    ),
  )

export const useOpenAppIds = () =>
  useWindowStore(useShallow((s) => s.windows.map((w) => w.appId)))

