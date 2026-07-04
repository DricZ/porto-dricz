import { useState } from "react"
import {
  BatteryMedium,
  Bluetooth,
  Moon,
  Power,
  Settings,
  Sun,
  Volume2,
  Wifi,
} from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"

export function QuickSettings() {
  const [volume, setVolume] = useState([70])
  const [brightness, setBrightness] = useState([90])
  const [isDark, setIsDark] = useState(true)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div className="flex items-center gap-3 cursor-pointer opacity-90 hover:opacity-100 transition-opacity rounded-full px-2 py-0.5 hover:bg-white/10">
          <Wifi size={14} />
          <Volume2 size={14} />
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-medium">76%</span>
            <BatteryMedium size={14} />
          </div>
        </div>
      </PopoverTrigger>
      
      <PopoverContent 
        className="w-[calc(100vw-1rem)] sm:w-80 rounded-2xl bg-[#1e1e1e]/90 backdrop-blur-xl border-white/10 shadow-2xl p-3 sm:p-4 mr-2 text-white dark" 
        align="end" 
        sideOffset={8}
      >
        <div className="flex flex-col gap-5">
          {/* Sliders */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <Volume2 size={18} className="text-white/70" />
              <Slider
                value={volume}
                onValueChange={setVolume}
                max={100}
                step={1}
                className="cursor-pointer"
              />
            </div>
            <div className="flex items-center gap-3">
              <Sun size={18} className="text-white/70" />
              <Slider
                value={brightness}
                onValueChange={setBrightness}
                max={100}
                step={1}
                className="cursor-pointer"
              />
            </div>
          </div>

          <Separator className="bg-white/10" />

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            <button className="flex items-center gap-3 rounded-full bg-blue-500/20 px-3 sm:px-4 py-2 transition-colors hover:bg-blue-500/30 overflow-hidden w-full">
              <div className="shrink-0 rounded-full bg-blue-500 p-1.5 flex items-center justify-center">
                <Wifi size={16} className="text-white" />
              </div>
              <div className="flex flex-col items-start overflow-hidden min-w-0 flex-1">
                <span className="text-sm font-medium truncate w-full text-left">Wi-Fi</span>
                <span className="text-xs text-blue-200/80 truncate w-full text-left">Dricz_5G</span>
              </div>
            </button>
            <button className="flex items-center gap-3 rounded-full bg-white/5 px-3 sm:px-4 py-2 transition-colors hover:bg-white/10 overflow-hidden w-full">
              <div className="shrink-0 rounded-full bg-white/10 p-1.5 flex items-center justify-center">
                <Bluetooth size={16} className="text-white/70" />
              </div>
              <div className="flex flex-col items-start overflow-hidden min-w-0 flex-1">
                <span className="text-sm font-medium truncate w-full text-left">Bluetooth</span>
                <span className="text-xs text-white/50 truncate w-full text-left">Off</span>
              </div>
            </button>
            <button 
              onClick={() => setIsDark(!isDark)}
              className={`flex items-center gap-3 rounded-full px-3 sm:px-4 py-2 transition-colors overflow-hidden w-full ${isDark ? 'bg-blue-500/20 hover:bg-blue-500/30' : 'bg-white/5 hover:bg-white/10'}`}
            >
              <div className={`shrink-0 rounded-full p-1.5 flex items-center justify-center ${isDark ? 'bg-blue-500' : 'bg-white/10'}`}>
                {isDark ? <Moon size={16} className="text-white" /> : <Sun size={16} className="text-white/70" />}
              </div>
              <div className="flex flex-col items-start overflow-hidden min-w-0 flex-1">
                <span className="text-sm font-medium truncate w-full text-left">Dark Style</span>
                <span className={`text-xs truncate w-full text-left ${isDark ? 'text-blue-200/80' : 'text-white/50'}`}>{isDark ? "On" : "Off"}</span>
              </div>
            </button>
            <button className="flex items-center gap-3 rounded-full bg-white/5 px-3 sm:px-4 py-2 transition-colors hover:bg-white/10 overflow-hidden w-full">
              <div className="shrink-0 rounded-full bg-white/10 p-1.5 flex items-center justify-center">
                <Settings size={16} className="text-white/70" />
              </div>
              <div className="flex flex-col items-start justify-center overflow-hidden min-w-0 flex-1 h-full">
                <span className="text-sm font-medium truncate w-full text-left">Settings</span>
              </div>
            </button>
          </div>

          <Separator className="bg-white/10" />

          {/* Power Options */}
          <div className="flex justify-end gap-2">
            <button 
              className="rounded-full bg-white/5 p-2 transition-colors hover:bg-white/10 hover:text-red-400"
              onClick={() => window.location.reload()}
            >
              <Power size={18} />
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
