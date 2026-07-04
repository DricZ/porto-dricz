import { useState } from "react"
import { Send, Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { WindowState } from "@/types"

export function ContactApp({ window }: { window: WindowState }) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: ""
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)
    
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })
      
      if (!res.ok) {
        if (res.status === 429) {
          throw new Error("You have already sent a message recently. Please try again later.")
        }
        throw new Error("Failed to send message.")
      }
      
      setSuccess(true)
      setFormData({ name: "", email: "", message: "" })
    } catch (err: any) {
      setError(err.message || "An error occurred.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-full flex-col bg-[#1e1e1e] text-white">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-md mx-auto">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-semibold mb-2">Get in Touch</h2>
            <p className="text-white/60 text-sm">Send me a message and I'll get back to you as soon as possible.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input 
                id="name"
                name="name" 
                placeholder="Your Name" 
                value={formData.name}
                onChange={handleChange}
                required 
                className="bg-white/5 border-white/10"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                name="email"
                type="email" 
                placeholder="your.email@example.com" 
                value={formData.email}
                onChange={handleChange}
                required 
                className="bg-white/5 border-white/10"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea 
                id="message" 
                name="message"
                placeholder="What's on your mind?" 
                rows={5}
                value={formData.message}
                onChange={handleChange}
                required
                className="bg-white/5 border-white/10 resize-none"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm p-3 bg-red-400/10 rounded-md">
                <AlertCircle size={16} />
                <p>{error}</p>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 text-green-400 text-sm p-3 bg-green-400/10 rounded-md">
                <CheckCircle2 size={16} />
                <p>Message sent successfully!</p>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" /> Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 size-4" /> Send Message
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
