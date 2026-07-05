import { memo, useState, useEffect } from "react"
import {
  ExternalLink,
  Link,
  Mail,
  MapPin,
  Download,
  Briefcase,
  Code2,
  User,
  Lock,
  Shield,
  Pencil,
  Plus,
  Trash2,
  Menu,
  Monitor,
  ImageIcon,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { signIn, useSession, signOut, changeEmail, changePassword } from "@/lib/auth-client"
import {
  getSettings,
  updateSetting,
  getExperiences,
  createExperience,
  updateExperience,
  deleteExperience,
  getSkills,
  createSkill,
  updateSkill,
  deleteSkill,
  getContacts,
  createContact,
  updateContact,
  deleteContact,
} from "@/app/actions/cms"
import type { Setting, Experience, Skill, Contact, ContactMessage } from "@prisma/client"
import { format } from "date-fns"

export const SettingsApp = memo(function SettingsApp() {
  const { data: session, isPending } = useSession()
  
  // Data states
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [experiences, setExperiences] = useState<Experience[]>([])
  const [skills, setSkills] = useState<Skill[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  
  // Messages states
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [messagesPage, setMessagesPage] = useState(1)
  const [messagesTotalPages, setMessagesTotalPages] = useState(1)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)

  // Auth states
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isUpdatingSecurity, setIsUpdatingSecurity] = useState(false)
  const [isUploadingWallpaper, setIsUploadingWallpaper] = useState(false)
  const [isUploadingResume, setIsUploadingResume] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)

  // Dialog & Form states
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [profileForm, setProfileForm] = useState({ name: "", title: "", location: "", bio: "" })
  
  const [isExpOpen, setIsExpOpen] = useState(false)
  const [editingExp, setEditingExp] = useState<Experience | null>(null)
  const [expForm, setExpForm] = useState({ role: "", company: "", period: "", description: "" })

  const [isSkillOpen, setIsSkillOpen] = useState(false)
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null)
  const [skillForm, setSkillForm] = useState({ category: "", name: "" })

  const [isContactOpen, setIsContactOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [contactForm, setContactForm] = useState({ label: "", href: "", iconName: "Link" })

  const [isLoadingData, setIsLoadingData] = useState(true)

  useEffect(() => {
    let mounted = true
    Promise.all([
      getSettings(),
      getExperiences(),
      getSkills(),
      getContacts(),
    ]).then(([settingsData, experiencesData, skillsData, contactsData]) => {
      if (!mounted) return
      
      const settingsMap: Record<string, string> = (settingsData as any) || {}
      setSettings(settingsMap)
      setProfileForm({
        name: settingsMap.name || "",
        title: settingsMap.title || "",
        location: settingsMap.location || "",
        bio: settingsMap.bio || "",
      })
      
      setExperiences(experiencesData as Experience[])
      setSkills(skillsData as Skill[])
      setContacts(contactsData as Contact[])
      setIsLoadingData(false)
    }).catch((err) => {
      console.error("Failed to load settings:", err)
      if (mounted) setIsLoadingData(false)
    })
    
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (session?.user) {
      const fetchMessages = async () => {
        setIsLoadingMessages(true)
        try {
          const res = await fetch(`/api/contact?page=${messagesPage}`)
          if (res.ok) {
            const data = await res.json()
            setMessages(data.messages)
            setMessagesTotalPages(data.pagination.totalPages)
          }
        } catch (err) {
          console.error("Failed to fetch messages:", err)
        } finally {
          setIsLoadingMessages(false)
        }
      }
      fetchMessages()
    }
  }, [session, messagesPage])

  // Handlers
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    await updateSetting("name", profileForm.name)
    await updateSetting("title", profileForm.title)
    await updateSetting("location", profileForm.location)
    await updateSetting("bio", profileForm.bio)
    setSettings(prev => ({ ...prev, ...profileForm }))
    setIsProfileOpen(false)
  }

  const handleUploadWallpaper = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingWallpaper(true)
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type })
      })
      
      const { presignedUrl, url } = await res.json()
      if (presignedUrl) {
        await fetch(presignedUrl, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type }
        })
        await updateSetting("wallpaper", url)
        setSettings(prev => ({ ...prev, wallpaper: url }))
        window.dispatchEvent(new CustomEvent("wallpaperChanged", { detail: url }))
        alert("Wallpaper updated successfully!")
      } else {
        alert("Failed to get upload URL.")
      }
    } catch (err) {
      console.error(err)
      alert("Upload failed.")
    } finally {
      setIsUploadingWallpaper(false)
    }
  }

  const handleUploadResume = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingResume(true)
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type })
      })
      
      const { presignedUrl, url } = await res.json()
      if (presignedUrl) {
        await fetch(presignedUrl, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type }
        })
        await updateSetting("resume", url)
        setSettings(prev => ({ ...prev, resume: url }))
        alert("Resume updated successfully!")
      } else {
        alert("Failed to get upload URL.")
      }
    } catch (err) {
      console.error(err)
      alert("Upload failed.")
    } finally {
      setIsUploadingResume(false)
    }
  }

  const handleUploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingAvatar(true)
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type })
      })
      
      const { presignedUrl, url } = await res.json()
      if (presignedUrl) {
        await fetch(presignedUrl, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type }
        })
        await updateSetting("avatar", url)
        setSettings(prev => ({ ...prev, avatar: url }))
        alert("Avatar updated successfully!")
      } else {
        alert("Failed to get upload URL.")
      }
    } catch (err) {
      console.error(err)
      alert("Upload failed.")
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const handleAddExperience = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingExp) {
      const updated = await updateExperience(editingExp.id, { ...expForm })
      setExperiences(prev => prev.map(x => x.id === editingExp.id ? (updated as any) : x))
    } else {
      const newExp = await createExperience({ ...expForm })
      setExperiences(prev => [...prev, newExp as any])
    }
    setIsExpOpen(false)
    setEditingExp(null)
    setExpForm({ role: "", company: "", period: "", description: "" })
  }
  
  const handleEditExperience = (exp: Experience) => {
    setEditingExp(exp)
    setExpForm({ role: exp.role, company: exp.company, period: exp.period, description: exp.description })
    setIsExpOpen(true)
  }

  const handleDeleteExperience = async (id: string) => {
    if (!confirm("Are you sure?")) return
    await deleteExperience(id)
    setExperiences(prev => prev.filter(x => x.id !== id))
  }

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingSkill) {
      const updated = await updateSkill(editingSkill.id, { ...skillForm })
      setSkills(prev => prev.map(x => x.id === editingSkill.id ? (updated as any) : x))
    } else {
      const newSkill = await createSkill({ ...skillForm })
      setSkills(prev => [...prev, newSkill as any])
    }
    setIsSkillOpen(false)
    setEditingSkill(null)
    setSkillForm({ category: "", name: "" })
  }
  
  const handleEditSkill = (skill: Skill) => {
    setEditingSkill(skill)
    setSkillForm({ category: skill.category, name: skill.name })
    setIsSkillOpen(true)
  }

  const handleDeleteSkill = async (id: string) => {
    if (!confirm("Are you sure?")) return
    await deleteSkill(id)
    setSkills(prev => prev.filter(x => x.id !== id))
  }

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingContact) {
      const updated = await updateContact(editingContact.id, { ...contactForm })
      setContacts(prev => prev.map(x => x.id === editingContact.id ? (updated as any) : x))
    } else {
      const newContact = await createContact({ ...contactForm })
      setContacts(prev => [...prev, newContact as any])
    }
    setIsContactOpen(false)
    setEditingContact(null)
    setContactForm({ label: "", href: "", iconName: "Link" })
  }
  
  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact)
    setContactForm({ label: contact.label, href: contact.href || "", iconName: contact.iconName })
    setIsContactOpen(true)
  }
  
  const handleDeleteContact = async (id: string) => {
    if (!confirm("Are you sure?")) return
    await deleteContact(id)
    setContacts(prev => prev.filter(x => x.id !== id))
  }

  const handleUpdateEmail = async () => {
    if (!newEmail) return
    setIsUpdatingSecurity(true)
    await changeEmail({ newEmail }, {
      onSuccess: () => {
        setIsUpdatingSecurity(false)
        setNewEmail("")
        alert("Email updated successfully")
      },
      onError: (ctx) => {
        setIsUpdatingSecurity(false)
        alert(ctx.error.message)
      }
    })
  }

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword) return
    setIsUpdatingSecurity(true)
    await changePassword({ newPassword, currentPassword }, {
      onSuccess: () => {
        setIsUpdatingSecurity(false)
        setCurrentPassword("")
        setNewPassword("")
        alert("Password updated successfully")
      },
      onError: (ctx) => {
        setIsUpdatingSecurity(false)
        alert(ctx.error.message)
      }
    })
  }

  const handleLogin = async () => {
    setIsLoading(true)
    await signIn.email(
      {
        email,
        password,
      },
      {
        onSuccess: () => {
          setIsLoading(false)
        },
        onError: (ctx) => {
          setIsLoading(false)
          alert(ctx.error.message)
        },
      }
    )
  }

  return (
    <div className="flex h-full flex-col sm:flex-row bg-[#1e1e1e] text-white">
      <Tabs
        defaultValue="profile"
        orientation="vertical"
        className="flex h-full w-full flex-col sm:flex-row"
      >
        {/* Sidebar — hidden on mobile */}
        <div className="hidden sm:flex sm:h-full sm:w-48 shrink-0 sm:flex-col border-r border-white/10 bg-[#252525] p-2">
          <div className="mb-4 px-3 text-sm font-semibold text-white/50">
            Settings
          </div>
          <TabsList className="flex h-auto sm:w-full sm:flex-col gap-1 bg-transparent p-0">
            <TabsTrigger
              value="profile"
              className="justify-start gap-2 rounded-md !border-transparent px-3 py-1.5 text-sm font-medium text-gray-400 !shadow-none ring-0 after:hidden hover:!bg-white/10 hover:!text-white focus-visible:ring-0 data-[state=active]:!bg-blue-500/20 data-[state=active]:!text-blue-400"
            >
              <User className="size-4" />
              Profile
            </TabsTrigger>
            {session && (
              <TabsTrigger
                value="appearance"
                className="justify-start gap-2 rounded-md !border-transparent px-3 py-1.5 text-sm font-medium text-gray-400 !shadow-none ring-0 after:hidden hover:!bg-white/10 hover:!text-white focus-visible:ring-0 data-[state=active]:!bg-blue-500/20 data-[state=active]:!text-blue-400"
              >
                <Monitor className="size-4" />
                Appearance
              </TabsTrigger>
            )}
            <TabsTrigger
              value="experience"
              className="justify-start gap-2 rounded-md !border-transparent px-3 py-1.5 text-sm font-medium text-gray-400 !shadow-none ring-0 after:hidden hover:!bg-white/10 hover:!text-white focus-visible:ring-0 data-[state=active]:!bg-blue-500/20 data-[state=active]:!text-blue-400"
            >
              <Briefcase className="size-4" />
              Experience
            </TabsTrigger>
            <TabsTrigger
              value="skills"
              className="justify-start gap-2 rounded-md !border-transparent px-3 py-1.5 text-sm font-medium text-gray-400 !shadow-none ring-0 after:hidden hover:!bg-white/10 hover:!text-white focus-visible:ring-0 data-[state=active]:!bg-blue-500/20 data-[state=active]:!text-blue-400"
            >
              <Code2 className="size-4" />
              Skills
            </TabsTrigger>
            <TabsTrigger
              value="contact"
              className="justify-start gap-2 rounded-md !border-transparent px-3 py-1.5 text-sm font-medium text-gray-400 !shadow-none ring-0 after:hidden hover:!bg-white/10 hover:!text-white focus-visible:ring-0 data-[state=active]:!bg-blue-500/20 data-[state=active]:!text-blue-400"
            >
              <Mail className="size-4" />
              Contact
            </TabsTrigger>
            {session && (
              <TabsTrigger
                value="messages"
                className="justify-start gap-2 rounded-md !border-transparent px-3 py-1.5 text-sm font-medium text-gray-400 !shadow-none ring-0 after:hidden hover:!bg-white/10 hover:!text-white focus-visible:ring-0 data-[state=active]:!bg-blue-500/20 data-[state=active]:!text-blue-400"
              >
                <MessageSquare className="size-4" />
                Messages
              </TabsTrigger>
            )}
            <TabsTrigger
              value="admin"
              className="justify-start gap-2 rounded-md !border-transparent px-3 py-1.5 text-sm font-medium text-gray-400 !shadow-none ring-0 after:hidden hover:!bg-white/10 hover:!text-white focus-visible:ring-0 data-[state=active]:!bg-blue-500/20 data-[state=active]:!text-blue-400"
            >
              <Lock className="size-4" />
              Admin
            </TabsTrigger>
            {session && (
              <TabsTrigger
                value="security"
                className="justify-start gap-2 rounded-md !border-transparent px-3 py-1.5 text-sm font-medium text-gray-400 !shadow-none ring-0 after:hidden hover:!bg-white/10 hover:!text-white focus-visible:ring-0 data-[state=active]:!bg-blue-500/20 data-[state=active]:!text-blue-400"
              >
                <Shield className="size-4" />
                Security
              </TabsTrigger>
            )}
          </TabsList>
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Mobile Header */}
          <div className="sm:hidden flex h-12 items-center border-b border-white/10 px-4 bg-[#252525]">
            <Sheet>
              <SheetTrigger asChild>
                <button className="mr-3 text-white/70 hover:text-white transition-colors">
                  <Menu size={20} />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 bg-[#252525] border-white/10 text-white p-2">
                <SheetHeader className="mb-4 px-3 text-left">
                  <SheetTitle className="text-sm font-semibold text-white/50">Settings</SheetTitle>
                </SheetHeader>
                <TabsList className="flex h-auto w-full flex-col gap-1 bg-transparent p-0">
                  <SheetTrigger asChild>
                    <TabsTrigger
                      value="profile"
                      className="justify-start gap-2 rounded-md !border-transparent px-3 py-2 text-sm font-medium text-gray-400 !shadow-none ring-0 after:hidden hover:!bg-white/10 hover:!text-white focus-visible:ring-0 data-[state=active]:!bg-blue-500/20 data-[state=active]:!text-blue-400 w-full"
                    >
                      <User className="size-4" />
                      Profile
                    </TabsTrigger>
                  </SheetTrigger>
                  {session && (
                    <SheetTrigger asChild>
                      <TabsTrigger
                        value="appearance"
                        className="justify-start gap-2 rounded-md !border-transparent px-3 py-2 text-sm font-medium text-gray-400 !shadow-none ring-0 after:hidden hover:!bg-white/10 hover:!text-white focus-visible:ring-0 data-[state=active]:!bg-blue-500/20 data-[state=active]:!text-blue-400 w-full"
                      >
                        <Monitor className="size-4" />
                        Appearance
                      </TabsTrigger>
                    </SheetTrigger>
                  )}
                  <SheetTrigger asChild>
                    <TabsTrigger
                      value="experience"
                      className="justify-start gap-2 rounded-md !border-transparent px-3 py-2 text-sm font-medium text-gray-400 !shadow-none ring-0 after:hidden hover:!bg-white/10 hover:!text-white focus-visible:ring-0 data-[state=active]:!bg-blue-500/20 data-[state=active]:!text-blue-400 w-full"
                    >
                      <Briefcase className="size-4" />
                      Experience
                    </TabsTrigger>
                  </SheetTrigger>
                  <SheetTrigger asChild>
                    <TabsTrigger
                      value="skills"
                      className="justify-start gap-2 rounded-md !border-transparent px-3 py-2 text-sm font-medium text-gray-400 !shadow-none ring-0 after:hidden hover:!bg-white/10 hover:!text-white focus-visible:ring-0 data-[state=active]:!bg-blue-500/20 data-[state=active]:!text-blue-400 w-full"
                    >
                      <Code2 className="size-4" />
                      Skills
                    </TabsTrigger>
                  </SheetTrigger>
                  <SheetTrigger asChild>
                    <TabsTrigger
                      value="contact"
                      className="justify-start gap-2 rounded-md !border-transparent px-3 py-2 text-sm font-medium text-gray-400 !shadow-none ring-0 after:hidden hover:!bg-white/10 hover:!text-white focus-visible:ring-0 data-[state=active]:!bg-blue-500/20 data-[state=active]:!text-blue-400 w-full"
                    >
                      <Mail className="size-4" />
                      Contact
                    </TabsTrigger>
                  </SheetTrigger>
                  {session && (
                    <SheetTrigger asChild>
                      <TabsTrigger
                        value="messages"
                        className="justify-start gap-2 rounded-md !border-transparent px-3 py-2 text-sm font-medium text-gray-400 !shadow-none ring-0 after:hidden hover:!bg-white/10 hover:!text-white focus-visible:ring-0 data-[state=active]:!bg-blue-500/20 data-[state=active]:!text-blue-400 w-full"
                      >
                        <MessageSquare className="size-4" />
                        Messages
                      </TabsTrigger>
                    </SheetTrigger>
                  )}
                  <SheetTrigger asChild>
                    <TabsTrigger
                      value="admin"
                      className="justify-start gap-2 rounded-md !border-transparent px-3 py-2 text-sm font-medium text-gray-400 !shadow-none ring-0 after:hidden hover:!bg-white/10 hover:!text-white focus-visible:ring-0 data-[state=active]:!bg-blue-500/20 data-[state=active]:!text-blue-400 w-full"
                    >
                      <Lock className="size-4" />
                      Admin
                    </TabsTrigger>
                  </SheetTrigger>
                  {session && (
                    <SheetTrigger asChild>
                      <TabsTrigger
                        value="security"
                        className="justify-start gap-2 rounded-md !border-transparent px-3 py-2 text-sm font-medium text-gray-400 !shadow-none ring-0 after:hidden hover:!bg-white/10 hover:!text-white focus-visible:ring-0 data-[state=active]:!bg-blue-500/20 data-[state=active]:!text-blue-400 w-full"
                      >
                        <Shield className="size-4" />
                        Security
                      </TabsTrigger>
                    </SheetTrigger>
                  )}
                </TabsList>
              </SheetContent>
            </Sheet>
            <div className="text-sm font-medium">Settings</div>
          </div>
          
          <div className="flex-1 overflow-y-auto min-h-0">
          <TabsContent value="profile" className="m-0 p-3 sm:p-6 outline-none">
            <div className="flex flex-col items-center gap-4 relative">
              {session && (
                <div className="absolute right-0 top-0">
                  <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2 text-black">
                        <Pencil className="size-4" /> Edit Profile
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="text-black sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Edit Profile</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleSaveProfile} className="space-y-4 pt-4">
                        <div className="space-y-2">
                          <Label>Name</Label>
                          <Input value={profileForm.name} onChange={e => setProfileForm({...profileForm, name: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <Label>Title</Label>
                          <Input value={profileForm.title} onChange={e => setProfileForm({...profileForm, title: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <Label>Location</Label>
                          <Input value={profileForm.location} onChange={e => setProfileForm({...profileForm, location: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <Label>Bio</Label>
                          <Textarea rows={4} value={profileForm.bio} onChange={e => setProfileForm({...profileForm, bio: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <Label>Upload Avatar</Label>
                          <Input 
                            type="file" 
                            accept="image/*"
                            onChange={handleUploadAvatar}
                            disabled={isUploadingAvatar}
                          />
                          {isUploadingAvatar && <p className="text-xs text-white/50">Uploading...</p>}
                          {settings.avatar && !isUploadingAvatar && (
                            <p className="text-xs text-green-500">Avatar uploaded. You can upload a new one to replace it.</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label>Upload CV/Resume</Label>
                          <Input 
                            type="file" 
                            accept="application/pdf,.doc,.docx"
                            onChange={handleUploadResume}
                            disabled={isUploadingResume}
                          />
                          {isUploadingResume && <p className="text-xs text-white/50">Uploading...</p>}
                          {settings.resume && !isUploadingResume && (
                            <p className="text-xs text-green-500">CV uploaded. You can upload a new one to replace it.</p>
                          )}
                        </div>
                        <Button type="submit" className="w-full">Save Changes</Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
              
              <Avatar className="size-20">
                {settings.avatar && <AvatarImage src={settings.avatar} alt="Avatar" />}
                <AvatarFallback className="bg-orange-500 text-2xl font-bold text-white">
                  {isLoadingData ? "..." : (settings.name ? settings.name.substring(0, 2).toUpperCase() : "DR")}
                </AvatarFallback>
              </Avatar>
              <div className="text-center">
                <h2 className="text-xl font-semibold">
                  {isLoadingData ? "Loading..." : (settings.name || "Set your name")}
                </h2>
                <p className="text-sm text-white/60">
                  {isLoadingData ? "Loading..." : (settings.title || "Set your title")}
                </p>
                <div className="mt-1 flex items-center justify-center gap-1 text-xs text-white/40">
                  <MapPin className="size-3" />
                  {isLoadingData ? "Loading..." : (settings.location || "Set your location")}
                </div>
              </div>
              <Separator className="bg-white/10" />
              <p className="max-w-md text-center text-sm leading-relaxed text-white/70 whitespace-pre-wrap">
                {isLoadingData ? "Loading..." : (settings.bio || "Set your bio")}
              </p>
              {settings.resume && (
                <Button 
                  variant="outline" 
                  className="gap-2 border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
                  asChild
                >
                  <a href={settings.resume} target="_blank" rel="noreferrer">
                    <Download data-icon="inline-start font-black" />
                    Download Resume
                  </a>
                </Button>
              )}
            </div>
          </TabsContent>

          {session && (
            <TabsContent value="appearance" className="m-0 p-3 sm:p-6 outline-none">
            <h2 className="mb-4 text-lg font-semibold">Appearance</h2>
            <div className="flex max-w-sm flex-col gap-4">
              <h3 className="text-sm font-medium text-white/70">Desktop Wallpaper</h3>
              
              <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-white/20 bg-black/50">
                <img 
                  src={settings.wallpaper || "/wallpaper.png"} 
                  alt="Current Wallpaper" 
                  className="h-full w-full object-cover"
                />
              </div>

              {session ? (
                <div className="flex flex-col gap-2">
                  <label htmlFor="wallpaper-upload">
                    <Button variant="outline" className="w-full gap-2 text-black" asChild disabled={isUploadingWallpaper}>
                      <span>
                        <ImageIcon className="size-4" /> 
                        {isUploadingWallpaper ? "Uploading..." : "Upload New Wallpaper"}
                      </span>
                    </Button>
                  </label>
                  <input 
                    id="wallpaper-upload" 
                    type="file" 
                    accept="image/*,video/*" 
                    className="hidden" 
                    onChange={handleUploadWallpaper} 
                    disabled={isUploadingWallpaper}
                  />
                  <p className="text-xs text-white/50 text-center mt-1">
                    Supports images and videos. Uploaded files will be stored in R2.
                  </p>
                </div>
              ) : null}
            </div>
          </TabsContent>
          )}

          <TabsContent value="experience" className="m-0 p-3 sm:p-6 outline-none">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Experience</h2>
              {session && (
                <Dialog open={isExpOpen} onOpenChange={setIsExpOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2 text-black" onClick={() => {
                      setEditingExp(null)
                      setExpForm({ role: "", company: "", period: "", description: "" })
                    }}>
                      <Plus className="size-4" /> New Experience
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="text-black sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>{editingExp ? "Edit Experience" : "Add Experience"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddExperience} className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label>Role</Label>
                        <Input required value={expForm.role} onChange={e => setExpForm({...expForm, role: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <Label>Company</Label>
                        <Input required value={expForm.company} onChange={e => setExpForm({...expForm, company: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <Label>Period</Label>
                        <Input required value={expForm.period} onChange={e => setExpForm({...expForm, period: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea required rows={4} value={expForm.description} onChange={e => setExpForm({...expForm, description: e.target.value})} />
                      </div>
                      <Button type="submit" className="w-full">{editingExp ? "Save Changes" : "Add Experience"}</Button>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>
            
            <div className="flex flex-col gap-4">
              {experiences.map((exp) => (
                <div
                  key={exp.id}
                  className="group relative rounded-lg border border-white/10 bg-[#2a2a2a] p-4"
                >
                  {session && (
                    <div className="absolute right-2 top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleEditExperience(exp)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleDeleteExperience(exp.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  )}
                  <div className="flex items-start justify-between gap-2">
                    <div className="pr-8">
                      <h3 className="text-sm font-medium">{exp.role}</h3>
                      <p className="text-xs text-white/50">{exp.company}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-400">
                      {exp.period}
                    </span>
                  </div>
                  <Separator className="my-3 bg-white/10" />
                  <p className="text-xs leading-relaxed text-white/70 whitespace-pre-wrap">
                    {exp.description}
                  </p>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="skills" className="m-0 p-3 sm:p-6 outline-none">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Skills</h2>
              {session && (
                <Dialog open={isSkillOpen} onOpenChange={setIsSkillOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2 text-black" onClick={() => {
                      setEditingSkill(null)
                      setSkillForm({ category: "", name: "" })
                    }}>
                      <Plus className="size-4" /> New Skill
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="text-black sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>{editingSkill ? "Edit Skill" : "Add Skill"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddSkill} className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label>Category</Label>
                        <Input required value={skillForm.category} onChange={e => setSkillForm({...skillForm, category: e.target.value})} placeholder="e.g. Frontend" />
                      </div>
                      <div className="space-y-2">
                        <Label>Skill Name</Label>
                        <Input required value={skillForm.name} onChange={e => setSkillForm({...skillForm, name: e.target.value})} placeholder="e.g. React" />
                      </div>
                      <Button type="submit" className="w-full">{editingSkill ? "Save Changes" : "Add Skill"}</Button>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>
            
            <div className="flex flex-col gap-4">
              {Array.from(new Set(skills.map(s => s.category))).map(category => (
                <div key={category}>
                  <h3 className="mb-2 text-xs font-medium tracking-wider text-white/40 uppercase">
                    {category}
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {skills.filter(s => s.category === category).map((skill) => (
                      <Badge 
                        key={skill.id} 
                        variant="secondary"
                        className="group relative bg-white/5 text-white/70 hover:bg-white/10 border-transparent pr-2"
                      >
                        {skill.name}
                        {session && (
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 p-0.5 rounded">
                            <button 
                              onClick={() => handleEditSkill(skill)}
                              className="text-white hover:text-blue-400"
                            >
                              <Pencil className="size-3" />
                            </button>
                            <button 
                              onClick={() => handleDeleteSkill(skill.id)}
                              className="text-white hover:text-red-400"
                            >
                              <Trash2 className="size-3" />
                            </button>
                          </div>
                        )}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="contact" className="m-0 p-3 sm:p-6 outline-none">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Contact</h2>
              {session && (
                <Dialog open={isContactOpen} onOpenChange={setIsContactOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2 text-black" onClick={() => {
                      setEditingContact(null)
                      setContactForm({ label: "", href: "", iconName: "Link" })
                    }}>
                      <Plus className="size-4" /> New Contact
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="text-black sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>{editingContact ? "Edit Contact" : "Add Contact"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddContact} className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label>Label</Label>
                        <Input required value={contactForm.label} onChange={e => setContactForm({...contactForm, label: e.target.value})} placeholder="e.g. GitHub" />
                      </div>
                      <div className="space-y-2">
                        <Label>Link (optional)</Label>
                        <Input value={contactForm.href} onChange={e => setContactForm({...contactForm, href: e.target.value})} placeholder="https://..." />
                      </div>
                      <div className="space-y-2">
                        <Label>Icon Name</Label>
                        <Input value={contactForm.iconName} onChange={e => setContactForm({...contactForm, iconName: e.target.value})} placeholder="e.g. Link, Mail" />
                      </div>
                      <Button type="submit" className="w-full">{editingContact ? "Save Changes" : "Add Contact"}</Button>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>
            
            <div className="flex flex-col gap-3">
              {contacts.map((contact) => {
                const Icon = contact.href?.includes("mailto") ? Mail : (contact.href ? ExternalLink : MapPin)
                return (
                  <div key={contact.id} className="group relative flex items-center gap-3 rounded-lg border border-white/5 bg-white/5 p-4 transition-colors hover:bg-white/10">
                    <a
                      href={contact.href || "#"}
                      target={contact.href ? "_blank" : undefined}
                      rel={contact.href ? "noreferrer" : undefined}
                      className="flex items-center gap-3 flex-1"
                    >
                      <Icon className="size-5 text-white/50" />
                      <span className="text-sm font-medium">{contact.label}</span>
                    </a>
                    {session && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-8 w-8 text-black"
                          onClick={() => handleEditContact(contact)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-white/50 hover:bg-red-500 hover:text-white"
                          onClick={() => handleDeleteContact(contact.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </TabsContent>

          {session && (
            <TabsContent value="messages" className="m-0 p-3 sm:p-6 outline-none flex flex-col h-full">
              <h2 className="mb-4 text-lg font-semibold">Contact Messages</h2>
              
              <div className="flex-1 overflow-y-auto pr-2 space-y-4 min-h-0">
                {isLoadingMessages ? (
                  <p className="text-white/50 text-sm">Loading messages...</p>
                ) : messages.length === 0 ? (
                  <p className="text-white/50 text-sm">No messages found.</p>
                ) : (
                  messages.map(msg => (
                    <div key={msg.id} className="rounded-lg border border-white/10 bg-[#2a2a2a] p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium text-sm">{msg.name}</h3>
                          <a href={`mailto:${msg.email}`} className="text-xs text-blue-400 hover:underline">{msg.email}</a>
                        </div>
                        <span className="text-xs text-white/40">
                          {format(new Date(msg.createdAt), "MMM d, yyyy HH:mm")}
                        </span>
                      </div>
                      <Separator className="bg-white/10 my-3" />
                      <p className="text-sm text-white/80 whitespace-pre-wrap">{msg.message}</p>
                    </div>
                  ))
                )}
              </div>

              {messagesTotalPages > 1 && (
                <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 text-black"
                    disabled={messagesPage <= 1 || isLoadingMessages}
                    onClick={() => setMessagesPage(p => p - 1)}
                  >
                    <ChevronLeft className="size-4" /> Previous
                  </Button>
                  <span className="text-sm text-white/50">
                    Page {messagesPage} of {messagesTotalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 text-black"
                    disabled={messagesPage >= messagesTotalPages || isLoadingMessages}
                    onClick={() => setMessagesPage(p => p + 1)}
                  >
                    Next <ChevronRight className="size-4" />
                  </Button>
                </div>
              )}
            </TabsContent>
          )}

          <TabsContent value="admin" className="m-0 p-3 sm:p-6 outline-none">
            <h2 className="mb-4 text-lg font-semibold">Admin Login</h2>
            {session ? (
              <div className="flex max-w-sm flex-col gap-4">
                <p className="text-sm text-green-400">
                  Logged in as Admin ({session.user.email}).
                </p>
                <Button variant="destructive" onClick={() => signOut()}>
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="flex max-w-sm flex-col gap-4">
                <p className="text-sm text-white/60">
                  Log in to edit settings, upload files, and manage your
                  portfolio.
                </p>
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-white/50">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="rounded-md border border-white/10 bg-[#2a2a2a] px-3 py-2 text-sm text-white outline-none focus:border-orange-500"
                    placeholder="admin@example.com"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-white/50">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="rounded-md border border-white/10 bg-[#2a2a2a] px-3 py-2 text-sm text-white outline-none focus:border-orange-500"
                    placeholder="••••••••"
                  />
                </div>
                <Button
                  className="mt-2 bg-orange-600 hover:bg-orange-700"
                  onClick={handleLogin}
                  disabled={isLoading}
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </div>
            )}
          </TabsContent>

          {session && (
            <TabsContent value="security" className="m-0 p-3 sm:p-6">
              <h2 className="mb-4 text-lg font-semibold">Security Settings</h2>
              
              {/* Change Email */}
              <div className="mb-8 flex max-w-sm flex-col gap-4">
                <h3 className="text-sm font-medium text-white/70">Change Email</h3>
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-white/50">New Email</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="rounded-md border border-white/10 bg-[#2a2a2a] px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                    placeholder="new@example.com"
                  />
                </div>
                <Button
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={handleUpdateEmail}
                  disabled={isUpdatingSecurity || !newEmail}
                >
                  {isUpdatingSecurity ? "Updating..." : "Update Email"}
                </Button>
              </div>

              <Separator className="my-6 bg-white/10 max-w-sm" />

              {/* Change Password */}
              <div className="flex max-w-sm flex-col gap-4">
                <h3 className="text-sm font-medium text-white/70">Change Password</h3>
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-white/50">Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="rounded-md border border-white/10 bg-[#2a2a2a] px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                    placeholder="••••••••"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-white/50">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="rounded-md border border-white/10 bg-[#2a2a2a] px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                    placeholder="••••••••"
                  />
                </div>
                <Button
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={handleUpdatePassword}
                  disabled={isUpdatingSecurity || !currentPassword || !newPassword}
                >
                  {isUpdatingSecurity ? "Updating..." : "Update Password"}
                </Button>
              </div>
            </TabsContent>
          )}
          </div>
        </div>
      </Tabs>
    </div>
  )
})

export default SettingsApp
