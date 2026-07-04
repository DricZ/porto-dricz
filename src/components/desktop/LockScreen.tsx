import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getSettings } from "@/app/actions/cms"

interface LockScreenProps {
  onUnlock: () => void
}

export function LockScreen({ onUnlock }: LockScreenProps) {
  const [now, setNow] = useState(() => new Date())
  const [name, setName] = useState<string>("Loading...")
  const [avatar, setAvatar] = useState<string>("")
  const [isUnlocking, setIsUnlocking] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    let mounted = true
    getSettings().then((settings) => {
      if (!mounted) return
      const nameSetting = (settings as any).name
      const avatarSetting = (settings as any).avatar
      setName(nameSetting || "Dricz")
      setAvatar(avatarSetting || "")
    }).catch(err => {
      console.error(err)
      if (mounted) setName("Dricz")
    })
    return () => { mounted = false }
  }, [])

  const timeString = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: false,
  }).format(now)

  const dateString = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(now)

  const handleUnlock = () => {
    if (isUnlocking) return
    setIsUnlocking(true)
    setTimeout(() => {
      onUnlock()
    }, 500) // wait for animation to finish
  }

  // Allow unlocking by pressing Enter or Space
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        handleUnlock()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isUnlocking])

  return (
    <motion.div 
      className="absolute inset-0 z-[90] flex flex-col items-center justify-center bg-black/40 backdrop-blur-2xl text-white select-none cursor-pointer"
      onClick={handleUnlock}
      animate={{ 
        y: isUnlocking ? "-100%" : 0,
        opacity: isUnlocking ? 0 : 1
      }}
      transition={{ 
        duration: 0.5, 
        ease: [0.32, 0.72, 0, 1] // sleek ease-out cubic
      }}
    >
      <div className="absolute top-12 sm:top-24 flex flex-col items-center px-4">
        <h1 suppressHydrationWarning className="text-5xl sm:text-7xl font-light tracking-wider mb-2">{timeString}</h1>
        <p className="text-base sm:text-xl font-medium opacity-90">{dateString}</p>
        
        <div className="mt-8 text-center animate-in fade-in slide-in-from-bottom-2 duration-1000 delay-300 fill-mode-both">
          <p className="text-sm sm:text-base text-white/80 italic tracking-wide">
            "Welcome to my digital workspace. Feel free to explore!"
          </p>
        </div>
      </div>

      <div className="flex flex-col items-center gap-3 sm:gap-4 mt-20 sm:mt-28">
        <Avatar className="size-24 sm:size-32 border-4 border-white/20 shadow-2xl">
          {avatar && <AvatarImage src={avatar} alt={name} />}
          <AvatarFallback className="bg-orange-500 text-4xl sm:text-5xl font-bold text-white">
            {name === "Loading..." ? "..." : name.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col items-center gap-1">
          <h2 className="text-xl sm:text-2xl font-semibold">{name}</h2>
          <p className="text-xs sm:text-sm font-medium opacity-70 animate-pulse mt-3 sm:mt-4">Tap or press Enter to unlock</p>
        </div>
      </div>
    </motion.div>
  )
}
