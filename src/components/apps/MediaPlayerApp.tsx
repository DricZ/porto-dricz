import { memo, useState, useRef } from "react"
import { Play, Pause, SkipBack, SkipForward, Volume2, Shuffle, Repeat } from "lucide-react"

export const MediaPlayerApp = memo(function MediaPlayerApp() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(30) // dummy progress
  
  const togglePlay = () => {
    setIsPlaying(!isPlaying)
  }

  return (
    <div className="flex h-full flex-col bg-gray-900 text-white overflow-hidden font-sans">
      {/* Album Art Area */}
      <div className="relative flex-1 bg-gradient-to-br from-indigo-900 via-purple-900 to-black flex items-center justify-center p-8">
        <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay"></div>
        <div className="relative w-48 h-48 md:w-64 md:h-64 rounded-xl shadow-2xl overflow-hidden ring-1 ring-white/10 group">
          <img 
            src="https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=500&auto=format&fit=crop" 
            alt="Album Art"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        </div>
      </div>

      {/* Controls Area */}
      <div className="bg-[#181818] p-6 pb-8 border-t border-white/5 shadow-lg z-10">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1 tracking-tight">Midnight City</h2>
            <p className="text-gray-400 font-medium">Synthwave Mix</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden cursor-pointer">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md scale-0 group-hover:scale-100 transition-transform"></div>
            </div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2 font-medium tracking-wide">
            <span>1:12</span>
            <span>4:05</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between">
          <button className="text-gray-400 hover:text-white transition-colors p-2">
            <Shuffle size={20} />
          </button>
          
          <div className="flex items-center gap-4 md:gap-6">
            <button className="text-gray-300 hover:text-white transition-colors p-2">
              <SkipBack size={24} fill="currentColor" />
            </button>
            
            <button 
              onClick={togglePlay}
              className="w-14 h-14 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 transition-all shadow-lg shadow-white/10"
            >
              {isPlaying ? (
                <Pause size={24} fill="currentColor" />
              ) : (
                <Play size={24} fill="currentColor" className="ml-1" />
              )}
            </button>
            
            <button className="text-gray-300 hover:text-white transition-colors p-2">
              <SkipForward size={24} fill="currentColor" />
            </button>
          </div>

          <button className="text-gray-400 hover:text-white transition-colors p-2">
            <Repeat size={20} />
          </button>
        </div>
      </div>
    </div>
  )
})
