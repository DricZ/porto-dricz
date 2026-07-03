import { memo, useState } from "react"
import { ArrowLeft, ArrowRight, RotateCw, Home, Lock, Search, XCircle } from "lucide-react"

const BLOCKED_DOMAINS = [
  "google.com",
  "www.google.com",
  "github.com",
  "www.github.com",
  "linkedin.com",
  "www.linkedin.com",
  "facebook.com",
  "www.facebook.com",
  "twitter.com",
  "www.twitter.com",
  "instagram.com",
  "www.instagram.com",
  "x.com",
  "www.x.com",
  "bing.com",
  "www.bing.com"
]

export const ChromeApp = memo(function ChromeApp() {
  const [url, setUrl] = useState("https://www.wikipedia.org")
  const [inputUrl, setInputUrl] = useState(url)
  const [iframeKey, setIframeKey] = useState(0)

  const handleNavigate = (e?: React.FormEvent) => {
    e?.preventDefault()
    let finalUrl = inputUrl.trim()
    
    // If it doesn't look like a URL but rather a search query
    if (!finalUrl.includes(".") && !finalUrl.startsWith("http")) {
      finalUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(finalUrl)}`
    } else if (!finalUrl.startsWith("http://") && !finalUrl.startsWith("https://")) {
      finalUrl = `https://${finalUrl}`
    }
    
    setUrl(finalUrl)
    setInputUrl(finalUrl)
  }

  const handleReload = () => {
    setIframeKey((k) => k + 1)
  }

  const handleHome = () => {
    const homeUrl = "https://www.wikipedia.org"
    setUrl(homeUrl)
    setInputUrl(homeUrl)
  }

  // Determine which view to render
  let domain = ""
  try {
    if (url.startsWith("http")) {
      domain = new URL(url).hostname
    }
  } catch (e) {
    // ignore
  }

  const isBlocked = BLOCKED_DOMAINS.includes(domain)

  return (
    <div className="flex h-full w-full flex-col bg-white overflow-hidden">
      {/* Chrome Top Bar */}
      <div className="flex items-center gap-2 bg-[#f1f3f4] p-2 border-b border-gray-300 shadow-sm shrink-0">
        <div className="flex gap-2 text-gray-600">
          <button onClick={handleHome} className="rounded-full p-1.5 hover:bg-gray-200 transition-colors">
            <ArrowLeft size={16} />
          </button>
          <button className="rounded-full p-1.5 hover:bg-gray-200 disabled:opacity-50 transition-colors" disabled>
            <ArrowRight size={16} />
          </button>
          <button onClick={handleReload} className="rounded-full p-1.5 hover:bg-gray-200 transition-colors">
            <RotateCw size={16} />
          </button>
          <button onClick={handleHome} className="rounded-full p-1.5 hover:bg-gray-200 transition-colors">
            <Home size={16} />
          </button>
        </div>

        <form 
          onSubmit={handleNavigate}
          className="flex flex-1 items-center gap-2 rounded-full bg-white px-4 py-1.5 shadow-sm border border-transparent focus-within:border-blue-400 focus-within:shadow-md transition-all"
        >
          <span title={isBlocked ? "Proxied Connection" : "Secure Connection"}>
            <Lock size={14} className={isBlocked ? "text-yellow-500" : "text-gray-400"} />
          </span>
          <input
            type="text"
            className="flex-1 bg-transparent text-sm text-gray-800 outline-none"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            onFocus={(e) => e.target.select()}
            onBlur={() => setInputUrl(url)}
          />
        </form>
      </div>

      {/* Browser Content */}
      <div className="flex-1 bg-white relative overflow-y-auto">
        <iframe
          key={iframeKey}
          src={isBlocked ? `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}` : url}
          className="absolute inset-0 h-full w-full border-none"
          title="browser-content"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
        />
      </div>
    </div>
  )
})
