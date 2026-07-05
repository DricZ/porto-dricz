import { useState, useEffect, useRef } from "react"

const BOOT_SEQUENCE = [
  "================================================================================",
  "                              Welcome to Audrico Portfolio OS                               ",
  "                    Professional Desktop Environment v1.0.0                     ",
  "================================================================================",
  " ",
  "System Diagnostics:",
  "  - CPU: Intel(R) Core(TM) i7-12700H (14 cores, 20 threads)  [ OK ]",
  "  - Memory: 32768 MB DDR5-4800                               [ OK ]",
  "  - Storage: 2TB NVMe PCIe 4.0 SSD                           [ OK ]",
  "  - Network: Intel Wi-Fi 6E AX211                            [ OK ]",
  " ",
  "System checks passed successfully. Initializing boot sequence...",
  "--------------------------------------------------------------------------------",
  " ",
  "[    0.000000] Linux version 6.5.0-generic (buildd@lcy02-amd64-077) (x86_64-linux-gnu-gcc-12) #77-Ubuntu SMP PREEMPT_DYNAMIC",
  "[    0.000000] Command line: BOOT_IMAGE=/boot/vmlinuz-6.5.0 root=UUID=5f6e8b4a ro quiet splash",
  "[    0.012034] ACPI: Core revision 20230621",
  "[    0.012450] secureboot: Secure boot enabled",
  "[    0.012876] APIC: Streamlined APIC setup enabled",
  "[    0.013230] smpboot: CPU0: Intel(R) Core(TM) i7-12700H (family: 0x6, model: 0x9a, stepping: 0x3)",
  "[    0.345123] kernel: tsc: Fast TSC calibration using PIT",
  "[    0.347890] pci 0000:00:00.0: [8086:4641] type 00 class 0x060000",
  "[    0.348102] pci 0000:00:02.0: [8086:46a6] type 00 class 0x030000",
  "[    0.348250] pci 0000:00:14.0: [8086:51ed] type 00 class 0x0c0330",
  "[    0.512390] nvme nvme0: pci function 0000:01:00.0",
  "[    0.540120] nvme nvme0: 4/0/0 default/read/poll queues",
  "[    0.601200] ahci 0000:00:17.0: version 3.0",
  "[    0.612050] scsi host0: ahci",
  "[    0.614100] scsi host1: ahci",
  "[    0.723000] usb 1-1: new high-speed USB device number 2 using xhci_hcd",
  "[    0.854020] input: Logitech MX Master 3 as /devices/pci0000:00/0000:00:14.0/usb1/1-1/1-1:1.0/0003:046D:C52B.0001/input/input0",
  "[    1.012300] random: crng init done",
  "[    1.203040] EXT4-fs (nvme0n1p2): mounted filesystem with ordered data mode. Opts: (null)",
  "[  OK  ] Started Show Plymouth Boot Screen.",
  "[  OK  ] Reached target Local File Systems.",
  "[  OK  ] Started Tell Plymouth To Write Out Runtime Data.",
  "[  OK  ] Started Create Volatile Files and Directories.",
  "[  OK  ] Started Network Time Synchronization.",
  "[  OK  ] Started Record System Boot/Shutdown in UTMP.",
  "[  OK  ] Reached target System Initialization.",
  "[  OK  ] Started Daily Cleanup of Temporary Directories.",
  "[  OK  ] Started D-Bus System Message Bus.",
  "[  OK  ] Started User Login Management.",
  "[  OK  ] Reached target Basic System.",
  "[  OK  ] Started WPA supplicant.",
  "[  OK  ] Started Network Manager.",
  "[  OK  ] Started Network Manager Script Dispatcher Service.",
  "[  OK  ] Reached target Network.",
  "[  OK  ] Started Bluetooth service.",
  "[  OK  ] Started CUPS Scheduler.",
  "[  OK  ] Started Docker Application Container Engine.",
  "[  OK  ] Reached target Bluetooth Support.",
  "[  OK  ] Started Authorization Manager.",
  "[  OK  ] Started Accounts Service.",
  "[  OK  ] Started Modem Manager.",
  "[  OK  ] Started Thermal Daemon Service.",
  "[  OK  ] Started LSB: Record successful boot for GRUB.",
  "[  OK  ] Started GNOME Display Manager.",
  "[  OK  ] Reached target Login Prompts.",
  "[  OK  ] Reached target Graphical Interface.",
]

export function BootScreen({
  onBootComplete,
}: {
  onBootComplete?: () => void
}) {
  const [lines, setLines] = useState<string[]>([])
  const [isWaiting, setIsWaiting] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isWaiting) return

    let currentLine = 0
    let timeoutId: NodeJS.Timeout

    const addLine = () => {
      if (currentLine < BOOT_SEQUENCE.length) {
        setLines((prev) => [...prev, BOOT_SEQUENCE[currentLine]])
        currentLine++

        // Randomize delay between 20ms and 150ms to make it look realistic
        const delay = Math.random() * 130 + 20
        timeoutId = setTimeout(addLine, delay)
      } else {
        // Wait a brief moment before finishing the boot sequence
        timeoutId = setTimeout(() => {
          if (onBootComplete) onBootComplete()
        }, 600)
      }
    }

    // Start the sequence
    timeoutId = setTimeout(addLine, 100)

    return () => clearTimeout(timeoutId)
  }, [onBootComplete, isWaiting])

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView()
    }
  }, [lines])

  return (
    <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-black p-4 font-mono text-sm text-green-500">
      {isWaiting ? (
        <div className="flex max-w-sm animate-in flex-col items-center gap-6 rounded-2xl border border-neutral-700/50 bg-neutral-900/80 p-8 text-center shadow-2xl backdrop-blur-md duration-500 fade-in zoom-in">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border border-neutral-700/50 bg-neutral-800 shadow-inner">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-blue-400"
            >
              <path d="M12 2v10" />
              <path d="M18.4 6.6a9 9 0 1 1-12.77.04" />
            </svg>
          </div>
          <div>
            <h2 className="mb-2 text-2xl font-bold tracking-tight text-white">
              Audrico Portfolio OS
            </h2>
            <p className="text-sm text-neutral-400">
              Professional Desktop Environment
            </p>
          </div>
          <button
            onClick={() => setIsWaiting(false)}
            className="w-full rounded-xl bg-blue-600 px-4 py-2.5 font-medium text-white shadow-[0_0_15px_rgba(37,99,235,0.3)] transition-all hover:bg-blue-500 hover:shadow-[0_0_25px_rgba(37,99,235,0.5)] active:scale-95"
          >
            Start System
          </button>
        </div>
      ) : (
        <div className="w-full flex-1 overflow-y-auto text-left leading-tight whitespace-pre-wrap">
          {lines.map((line, i) => (
            <div key={i}>
              {line?.startsWith("[  OK  ]") ? (
                <>
                  [ <span className="font-bold text-green-500">OK</span> ]
                  {line.substring(8)}
                </>
              ) : (
                <span className="text-gray-300">{line}</span>
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  )
}
