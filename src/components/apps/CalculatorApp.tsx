import { memo, useState } from "react"
import { Delete } from "lucide-react"

export const CalculatorApp = memo(function CalculatorApp() {
  const [display, setDisplay] = useState("0")
  const [equation, setEquation] = useState("")
  const [shouldResetDisplay, setShouldResetDisplay] = useState(false)

  const handleNumber = (num: string) => {
    if (display === "0" || shouldResetDisplay) {
      setDisplay(num)
      setShouldResetDisplay(false)
    } else {
      setDisplay(display + num)
    }
  }

  const handleOperator = (op: string) => {
    setEquation(display + " " + op + " ")
    setShouldResetDisplay(true)
  }

  const handleEqual = () => {
    if (!equation) return
    try {
      // safe eval for basic calculator
      const result = new Function('return ' + equation + display)()
      setDisplay(String(result))
      setEquation("")
      setShouldResetDisplay(true)
    } catch (e) {
      setDisplay("Error")
      setEquation("")
      setShouldResetDisplay(true)
    }
  }

  const handleClear = () => {
    setDisplay("0")
    setEquation("")
  }

  const handleDelete = () => {
    if (shouldResetDisplay) return
    if (display.length === 1) {
      setDisplay("0")
    } else {
      setDisplay(display.slice(0, -1))
    }
  }

  const handleDecimal = () => {
    if (shouldResetDisplay) {
      setDisplay("0.")
      setShouldResetDisplay(false)
      return
    }
    if (!display.includes(".")) {
      setDisplay(display + ".")
    }
  }

  return (
    <div className="flex h-full flex-col bg-[#202020] text-white select-none">
      <div className="flex-1 p-4 flex flex-col justify-end items-end gap-1">
        <div className="text-gray-400 h-6 text-sm">{equation}</div>
        <div className="text-5xl font-light tracking-tight truncate max-w-full">
          {display}
        </div>
      </div>
      
      <div className="grid grid-cols-4 gap-1 p-1 bg-[#181818]">
        <button onClick={handleClear} className="bg-[#323232] hover:bg-[#3b3b3b] p-4 text-center rounded-sm transition-colors text-red-400">C</button>
        <button onClick={handleDelete} className="bg-[#323232] hover:bg-[#3b3b3b] p-4 flex items-center justify-center rounded-sm transition-colors"><Delete size={20} /></button>
        <button onClick={() => handleOperator("%")} className="bg-[#323232] hover:bg-[#3b3b3b] p-4 text-center rounded-sm transition-colors">%</button>
        <button onClick={() => handleOperator("/")} className="bg-[#323232] hover:bg-[#3b3b3b] p-4 text-center rounded-sm transition-colors text-orange-400">÷</button>
        
        <button onClick={() => handleNumber("7")} className="bg-[#3b3b3b] hover:bg-[#444444] p-4 text-center rounded-sm transition-colors font-semibold">7</button>
        <button onClick={() => handleNumber("8")} className="bg-[#3b3b3b] hover:bg-[#444444] p-4 text-center rounded-sm transition-colors font-semibold">8</button>
        <button onClick={() => handleNumber("9")} className="bg-[#3b3b3b] hover:bg-[#444444] p-4 text-center rounded-sm transition-colors font-semibold">9</button>
        <button onClick={() => handleOperator("*")} className="bg-[#323232] hover:bg-[#3b3b3b] p-4 text-center rounded-sm transition-colors text-orange-400">×</button>
        
        <button onClick={() => handleNumber("4")} className="bg-[#3b3b3b] hover:bg-[#444444] p-4 text-center rounded-sm transition-colors font-semibold">4</button>
        <button onClick={() => handleNumber("5")} className="bg-[#3b3b3b] hover:bg-[#444444] p-4 text-center rounded-sm transition-colors font-semibold">5</button>
        <button onClick={() => handleNumber("6")} className="bg-[#3b3b3b] hover:bg-[#444444] p-4 text-center rounded-sm transition-colors font-semibold">6</button>
        <button onClick={() => handleOperator("-")} className="bg-[#323232] hover:bg-[#3b3b3b] p-4 text-center rounded-sm transition-colors text-orange-400">−</button>
        
        <button onClick={() => handleNumber("1")} className="bg-[#3b3b3b] hover:bg-[#444444] p-4 text-center rounded-sm transition-colors font-semibold">1</button>
        <button onClick={() => handleNumber("2")} className="bg-[#3b3b3b] hover:bg-[#444444] p-4 text-center rounded-sm transition-colors font-semibold">2</button>
        <button onClick={() => handleNumber("3")} className="bg-[#3b3b3b] hover:bg-[#444444] p-4 text-center rounded-sm transition-colors font-semibold">3</button>
        <button onClick={() => handleOperator("+")} className="bg-[#323232] hover:bg-[#3b3b3b] p-4 text-center rounded-sm transition-colors text-orange-400">+</button>
        
        <button onClick={() => handleNumber("00")} className="bg-[#3b3b3b] hover:bg-[#444444] p-4 text-center rounded-sm transition-colors font-semibold">00</button>
        <button onClick={() => handleNumber("0")} className="bg-[#3b3b3b] hover:bg-[#444444] p-4 text-center rounded-sm transition-colors font-semibold">0</button>
        <button onClick={handleDecimal} className="bg-[#3b3b3b] hover:bg-[#444444] p-4 text-center rounded-sm transition-colors font-semibold">.</button>
        <button onClick={handleEqual} className="bg-orange-500 hover:bg-orange-600 p-4 text-center rounded-sm transition-colors text-white">=</button>
      </div>
    </div>
  )
})
