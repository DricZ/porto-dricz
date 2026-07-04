import { memo, useRef, useState, useEffect } from "react"
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Maximize } from "lucide-react"
import type { WindowState } from "@/types"

export const MediaPlayerApp = memo(function MediaPlayerApp({ window }: { window?: WindowState }) {
  const { fileUrl, fileName, fileType } = window?.initialData || {}

  const videoRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  const isVideo = fileType?.startsWith("video/")
  const isAudio = fileType?.startsWith("audio/")

  const [isPlaying, setIsPlaying] = useState(true)
  const [progress, setProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [showControls, setShowControls] = useState(true)

  const mediaRef = isVideo ? videoRef : audioRef

  useEffect(() => {
    return () => {
      // Force pause and clean up on unmount so audio doesn't keep playing in the background
      if (videoRef.current) {
        videoRef.current.pause()
        videoRef.current.removeAttribute('src')
        videoRef.current.load()
      }
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.removeAttribute('src')
        audioRef.current.load()
      }
    }
  }, [])

  useEffect(() => {
    let timeout: NodeJS.Timeout
    const resetControlsTimeout = () => {
      setShowControls(true)
      clearTimeout(timeout)
      if (isPlaying) {
        timeout = setTimeout(() => setShowControls(false), 3000)
      }
    }
    
    resetControlsTimeout()
    return () => clearTimeout(timeout)
  }, [isPlaying])

  const togglePlay = () => {
    if (mediaRef.current) {
      if (mediaRef.current.paused) {
        mediaRef.current.play()
      } else {
        mediaRef.current.pause()
      }
    }
  }

  const handleTimeUpdate = () => {
    if (mediaRef.current) {
      setCurrentTime(mediaRef.current.currentTime)
      setProgress((mediaRef.current.currentTime / mediaRef.current.duration) * 100)
    }
  }

  const handleLoadedMetadata = () => {
    if (mediaRef.current) {
      setDuration(mediaRef.current.duration)
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const seekTo = (parseFloat(e.target.value) / 100) * duration
    if (mediaRef.current) {
      mediaRef.current.currentTime = seekTo
      setProgress(parseFloat(e.target.value))
    }
  }

  const toggleMute = () => {
    if (mediaRef.current) {
      mediaRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00"
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  if (!fileUrl) {
    return (
      <div className="flex h-full items-center justify-center bg-[#1e1e1e] text-white">
        <p className="text-white/50">No media selected.</p>
      </div>
    )
  }

  return (
    <div 
      className="group relative flex h-full flex-col bg-[#1e1e1e] text-white font-sans overflow-hidden select-none"
      onMouseMove={() => setShowControls(true)}
    >
      {/* Media Player Area */}
      <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden" onClick={togglePlay}>
        {isVideo ? (
          <video
            ref={videoRef}
            src={fileUrl}
            className="w-full h-full object-contain"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
            autoPlay
          />
        ) : isAudio ? (
          <>
            <audio
              ref={audioRef}
              src={fileUrl}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
              autoPlay
            />
            {/* Audio Visualizer / Album Art Placeholder */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#3b1c4a] via-[#1e1e1e] to-[#0a0a0a] flex flex-col items-center justify-center p-8">
              <div className="w-32 h-32 md:w-48 md:h-48 rounded-full bg-white/5 border-4 border-white/10 flex items-center justify-center shadow-[0_0_50px_rgba(255,255,255,0.05)] animate-pulse-slow">
                <Music size={64} className="text-white/40" />
              </div>
              <h2 className="mt-8 text-xl font-medium text-white/90 text-center line-clamp-1 break-all px-4">{fileName}</h2>
            </div>
          </>
        ) : null}
      </div>

      {/* Ubuntu-like Controls Overlay */}
      <div 
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4 pt-12 transition-opacity duration-300 ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress Bar */}
        <div className="flex items-center gap-3 mb-3">
          <span className="text-xs font-medium text-white/80 w-10 text-right">{formatTime(currentTime)}</span>
          <div className="relative flex-1 h-1.5 group/slider cursor-pointer">
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={progress || 0}
              onChange={handleSeek}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="absolute inset-0 bg-white/20 rounded-full">
              <div 
                className="h-full bg-[#E95420] rounded-full relative"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md scale-0 group-hover/slider:scale-100 transition-transform"></div>
              </div>
            </div>
          </div>
          <span className="text-xs font-medium text-white/80 w-10">{formatTime(duration)}</span>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={togglePlay}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
            </button>
            <div className="hidden sm:block text-sm font-medium text-white/90 truncate max-w-[200px] md:max-w-[300px]">
              {fileName}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button onClick={toggleMute} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-white transition-colors">
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
})

import { Music } from "lucide-react" // Ensure Music is imported
