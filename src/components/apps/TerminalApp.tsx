import { memo, useEffect, useRef, useState } from "react"

const NEOFETCH_LINES = [
  "        .-/+oossssoo+/-.              dricz@ubuntu",
  "    `:+ssssssssssssssssss+:`          ──────────────",
  "  -+ssssssssssssssssssyyssss+-        OS: Ubuntu 24.04 LTS x86_64",
  " .ossssssssssssssssssdMMMNysssso.     Host: Portfolio v1.0",
  "/ssssssssssshdmmNNmmyNMMMMhssssss/    Kernel: React 19.x",
  "+ssssssssshmydMMMMMMMNddddyssssss+    Shell: TypeScript 6.x",
  "/sssssssshNMMMyhhyyyyhmNMMMNhssssss/  ──────────────",
  ".ssssssssdMMMNhsssssssssshNMMMdssssss. Role: Fullstack Software Developer",
  "+sssshhhyNMMNyssssssssssssyNMMMysssss+ Location: Surabaya, Indonesia",
  "ossyNMMMNyMMhsssssssssssssshmmmhssssso ──────────────",
  "ossyNMMMNyMMhsssssssssssssshmmmhssssso Stack: React · Go (Gin) · Laravel",
  "+sssshhhyNMMNyssssssssssssyNMMMysssss+        Docker · Proxmox",
  ".ssssssssdMMMNhsssssssssshNMMMdssssss. Editor: VS Code",
  "/sssssssshNMMMyhhyyyyhdNMMMNhssssss/  Terminal: GNOME Terminal",
  "+sssssssssdmydMMMMMMMMddddyssssss+    ──────────────",
  "/ssssssssssshdmNNNNmyNMMMMhssssss/",
  ".ossssssssssssssssssdMMMNysssso.",
  "  -+sssssssssssssssssyyyssss+-",
  "    `:+ssssssssssssssssss+:`",
  "        .-/+oossssoo+/-.",
]

const MOCK_FILESYSTEM: Record<string, string[]> = {
  "~": ["Desktop", "Documents", "Downloads", "Music", "Pictures", "Projects", "Videos"],
  "~/Projects": ["erp", "pos", "access", "dashboard"],
  "~/Desktop": ["chrome.desktop", "terminal.desktop"],
}

interface HistoryItem {
  id: string
  type: "input" | "output" | "error"
  text: string
}

export const TerminalApp = memo(function TerminalApp() {
  const [history, setHistory] = useState<HistoryItem[]>([
    { id: "init-1", type: "input", text: "neofetch" },
    ...NEOFETCH_LINES.map((line, i) => ({ id: `neo-${i}`, type: "output" as const, text: line })),
    { id: "init-info", type: "output", text: "\nType 'help' to see available commands." }
  ])
  const [input, setInput] = useState("")
  const [currentDir, setCurrentDir] = useState("~")
  
  // Nano state
  const [nanoOpen, setNanoOpen] = useState(false)
  const [nanoContent, setNanoContent] = useState("")
  
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "auto" })
  }, [history, nanoOpen])

  useEffect(() => {
    if (!nanoOpen) {
      inputRef.current?.focus()
    }
  }, [nanoOpen])

  const handleCommand = (cmd: string) => {
    const trimmed = cmd.trim()
    if (!trimmed) return

    const args = trimmed.split(" ")
    const command = args[0].toLowerCase()

    const newHistory: HistoryItem[] = []

    switch (command) {
      case "help":
        newHistory.push({
          id: crypto.randomUUID(),
          type: "output",
          text: "Available commands: help, clear, echo, ls, cd, pwd, whoami, neofetch, nano, ping",
        })
        break
      case "clear":
        setHistory([])
        return
      case "echo":
        newHistory.push({
          id: crypto.randomUUID(),
          type: "output",
          text: args.slice(1).join(" "),
        })
        break
      case "whoami":
        newHistory.push({
          id: crypto.randomUUID(),
          type: "output",
          text: "dricz",
        })
        break
      case "pwd":
        newHistory.push({
          id: crypto.randomUUID(),
          type: "output",
          text: currentDir === "~" ? "/home/dricz" : `/home/dricz/${currentDir.slice(2)}`,
        })
        break
      case "ls":
        const files = MOCK_FILESYSTEM[currentDir] || []
        newHistory.push({
          id: crypto.randomUUID(),
          type: "output",
          text: files.length > 0 ? files.join("  ") : "",
        })
        break
      case "cd":
        const target = args[1] || "~"
        let newDir = currentDir
        
        if (target === "~") {
          newDir = "~"
        } else if (target === "..") {
          if (currentDir !== "~") {
            const parts = currentDir.split("/")
            parts.pop()
            newDir = parts.join("/")
          }
        } else {
          const absoluteTarget = target.startsWith("~/") ? target : (currentDir === "~" ? `~/${target}` : `${currentDir}/${target}`)
          if (MOCK_FILESYSTEM[absoluteTarget]) {
            newDir = absoluteTarget
          } else {
            newHistory.push({
              id: crypto.randomUUID(),
              type: "error",
              text: `cd: ${target}: No such file or directory`,
            })
          }
        }
        if (newHistory.length === 0) setCurrentDir(newDir)
        break
      case "neofetch":
        NEOFETCH_LINES.forEach((line) => {
          newHistory.push({ id: crypto.randomUUID(), type: "output", text: line })
        })
        break
      case "ping":
        const host = args[1] || "google.com"
        newHistory.push({ id: crypto.randomUUID(), type: "output", text: `PING ${host} (142.250.191.46) 56(84) bytes of data.` })
        newHistory.push({ id: crypto.randomUUID(), type: "output", text: `64 bytes from ${host} (142.250.191.46): icmp_seq=1 ttl=115 time=14.2 ms` })
        newHistory.push({ id: crypto.randomUUID(), type: "output", text: `64 bytes from ${host} (142.250.191.46): icmp_seq=2 ttl=115 time=12.1 ms` })
        newHistory.push({ id: crypto.randomUUID(), type: "output", text: `64 bytes from ${host} (142.250.191.46): icmp_seq=3 ttl=115 time=13.5 ms` })
        break
      case "nano":
        setNanoOpen(true)
        return
      default:
        newHistory.push({
          id: crypto.randomUUID(),
          type: "error",
          text: `${command}: command not found`,
        })
    }

    setHistory((prev) => [...prev, ...newHistory])
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setHistory((prev) => [
      ...prev,
      { id: crypto.randomUUID(), type: "input", text: input },
    ])
    handleCommand(input)
    setInput("")
  }

  if (nanoOpen) {
    return (
      <div className="flex h-full flex-col bg-black p-2 font-mono text-sm text-gray-200">
        <div className="flex justify-between bg-gray-800 px-2 py-1 mb-2">
          <span>GNU nano 7.2</span>
          <span>New Buffer</span>
          <span></span>
        </div>
        <textarea 
          className="flex-1 bg-transparent outline-none resize-none"
          autoFocus
          value={nanoContent}
          onChange={(e) => setNanoContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.ctrlKey && e.key.toLowerCase() === "x") {
              e.preventDefault()
              setNanoOpen(false)
            }
          }}
        />
        <div className="mt-2 flex gap-4 bg-gray-800 px-2 py-1 text-xs">
          <span><span className="font-bold text-white">^X</span> Exit</span>
          <span><span className="font-bold text-white">^O</span> Write Out</span>
          <span><span className="font-bold text-white">^W</span> Where Is</span>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="h-full overflow-y-auto bg-[#300A24] p-3 font-mono text-sm text-white focus:outline-none"
      onClick={() => inputRef.current?.focus()}
    >
      <div className="flex flex-col gap-1">
        {history.map((item) => (
          <div key={item.id} className="whitespace-pre-wrap break-words">
            {item.type === "input" && (
              <div className="flex items-start gap-2">
                <span className="font-bold text-green-400">dricz@ubuntu</span>
                <span className="font-bold text-blue-400">{currentDir}</span>
                <span className="text-white">$</span>
                <span className="text-white">{item.text}</span>
              </div>
            )}
            {item.type === "output" && (
              <span className="text-gray-300">{item.text || "\u00A0"}</span>
            )}
            {item.type === "error" && (
              <span className="text-red-400">{item.text}</span>
            )}
          </div>
        ))}
      </div>

      <form onSubmit={onSubmit} className="mt-1 flex items-start gap-2">
        <span className="font-bold text-green-400 shrink-0">dricz@ubuntu</span>
        <span className="font-bold text-blue-400 shrink-0">{currentDir}</span>
        <span className="text-white shrink-0">$</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 bg-transparent text-white outline-none caret-white"
          autoFocus
        />
      </form>
      <div ref={bottomRef} />
    </div>
  )
})

export default TerminalApp
