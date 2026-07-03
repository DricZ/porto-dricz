export type AppId = "terminal" | "files" | "settings" | "chrome" | "calculator" | "mediaplayer"

export interface WindowState {
  id: string
  appId: AppId
  title: string
  position: { x: number; y: number }
  size: { width: number; height: number }
  isMinimized: boolean
  isMaximized: boolean
  zIndex: number
  initialData?: any
}

export interface DesktopIconData {
  id: string
  label: string
  appId: AppId | null
  iconName: string
}
