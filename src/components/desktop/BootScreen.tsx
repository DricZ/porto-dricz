import { Loader2 } from "lucide-react"

export function BootScreen() {
  return (
    <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-[#1a1a1a] text-white">
      <div className="mb-8 text-4xl font-bold tracking-widest text-[#E95420] select-none">
        ubuntu
      </div>
      <Loader2 className="size-8 animate-spin text-white/50" />
    </div>
  )
}
