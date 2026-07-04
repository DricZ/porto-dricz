import { useState, useEffect, useRef } from "react"

const BOOT_SEQUENCE = [
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

export function BootScreen({ onBootComplete }: { onBootComplete?: () => void }) {
  const [lines, setLines] = useState<string[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let currentLine = 0
    let timeoutId: NodeJS.Timeout

    const addLine = () => {
      if (currentLine < BOOT_SEQUENCE.length) {
        setLines(prev => [...prev, BOOT_SEQUENCE[currentLine]])
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
  }, [onBootComplete])

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView()
    }
  }, [lines])

  return (
    <div className="absolute inset-0 z-[100] bg-black text-green-500 font-mono text-sm p-4 overflow-hidden flex flex-col">
      <div className="flex-1 overflow-y-auto whitespace-pre-wrap leading-tight">
        {lines.map((line, i) => (
          <div key={i}>
            {line?.startsWith("[  OK  ]") ? (
              <>
                [  <span className="text-green-500 font-bold">OK</span>  ]{line.substring(8)}
              </>
            ) : (
              <span className="text-gray-300">{line}</span>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
