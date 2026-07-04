import { memo } from "react"
import type { WindowState } from "@/types"

export const PdfViewerApp = memo(function PdfViewerApp({ window }: { window?: WindowState }) {
  const { fileUrl, fileName } = window?.initialData || {}

  if (!fileUrl) {
    return (
      <div className="flex h-full items-center justify-center bg-[#f0f0f0] text-black">
        <p className="text-black/50">No PDF selected.</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col bg-[#e6e6e6]">
      {/* Ubuntu Evince-like Toolbar */}
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-black/10 bg-[#f5f5f5] px-4 shadow-sm z-10">
        <div className="font-semibold text-gray-700 truncate max-w-[60%]">
          {fileName || "Document"}
        </div>
        <div className="flex items-center gap-2">
           <span className="text-xs text-gray-500 bg-black/5 px-2 py-1 rounded">Read Only</span>
        </div>
      </div>

      {/* PDF Viewer Area */}
      <div className="flex-1 bg-[#525659] overflow-hidden relative">
        <object 
          data={fileUrl} 
          type="application/pdf" 
          className="absolute inset-0 w-full h-full"
        >
          <div className="flex h-full items-center justify-center bg-[#f0f0f0] flex-col gap-4 p-8 text-center">
            <p className="text-black/70">Your browser doesn't have a built-in PDF viewer.</p>
            <a 
              href={fileUrl} 
              target="_blank" 
              rel="noreferrer"
              className="bg-[#E95420] text-white px-4 py-2 rounded-md hover:bg-[#d64716] transition-colors"
            >
              Download PDF
            </a>
          </div>
        </object>
      </div>
    </div>
  )
})
