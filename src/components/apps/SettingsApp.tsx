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
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
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
  deleteExperience,
  getSkills,
  createSkill,
  deleteSkill,
  getContacts,
  createContact,
  deleteContact,
} from "@/app/actions/cms"
import type { Setting, Experience, Skill, Contact } from "@prisma/client"

export const SettingsApp = memo(function SettingsApp() {
  const { data: session, isPending } = useSession()
  
  // Data states
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [experiences, setExperiences] = useState<Experience[]>([])
  const [skills, setSkills] = useState<Skill[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])

  // Auth states
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isUpdatingSecurity, setIsUpdatingSecurity] = useState(false)

  // Dialog & Form states
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [profileForm, setProfileForm] = useState({ name: "", title: "", location: "", bio: "" })
  
  const [isExpOpen, setIsExpOpen] = useState(false)
  const [expForm, setExpForm] = useState({ role: "", company: "", period: "", description: "" })

  const [isSkillOpen, setIsSkillOpen] = useState(false)
  const [skillForm, setSkillForm] = useState({ category: "", name: "" })

  const [isContactOpen, setIsContactOpen] = useState(false)
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
      
      const settingsMap: Record<string, string> = {}
      settingsData.forEach((s: any) => {
        settingsMap[s.key] = s.value
      })
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

  const handleAddExperience = async (e: React.FormEvent) => {
    e.preventDefault()
    const newExp = await createExperience({ ...expForm })
    setExperiences(prev => [...prev, newExp as any])
    setIsExpOpen(false)
    setExpForm({ role: "", company: "", period: "", description: "" })
  }
  
  const handleDeleteExperience = async (id: string) => {
    if (!confirm("Are you sure?")) return
    await deleteExperience(id)
    setExperiences(prev => prev.filter(x => x.id !== id))
  }

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault()
    const newSkill = await createSkill({ ...skillForm })
    setSkills(prev => [...prev, newSkill as any])
    setIsSkillOpen(false)
    setSkillForm({ category: "", name: "" })
  }
  
  const handleDeleteSkill = async (id: string) => {
    if (!confirm("Are you sure?")) return
    await deleteSkill(id)
    setSkills(prev => prev.filter(x => x.id !== id))
  }

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault()
    const newContact = await createContact({ ...contactForm })
    setContacts(prev => [...prev, newContact as any])
    setIsContactOpen(false)
    setContactForm({ label: "", href: "", iconName: "Link" })
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
          
          <ScrollArea className="flex-1">
          <TabsContent value="profile" className="m-0 p-3 sm:p-6">
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
                        <Button type="submit" className="w-full">Save Changes</Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
              
              <Avatar className="size-20">
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
              <Button 
                variant="outline" 
                className="gap-2 border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                <Download data-icon="inline-start font-black" />
                Download Resume
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="experience" className="m-0 p-3 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Experience</h2>
              {session && (
                <Dialog open={isExpOpen} onOpenChange={setIsExpOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2 text-black">
                      <Plus className="size-4" /> Add Experience
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="text-black sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Add Experience</DialogTitle>
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
                      <Button type="submit" className="w-full">Add Experience</Button>
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
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute right-2 top-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDeleteExperience(exp.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
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

          <TabsContent value="skills" className="m-0 p-3 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Skills</h2>
              {session && (
                <Dialog open={isSkillOpen} onOpenChange={setIsSkillOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2 text-black">
                      <Plus className="size-4" /> Add Skill
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="text-black sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Add Skill</DialogTitle>
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
                      <Button type="submit" className="w-full">Add Skill</Button>
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
                          <button 
                            onClick={() => handleDeleteSkill(skill.id)}
                            className="ml-2 rounded-full p-0.5 hover:bg-red-500 hover:text-white"
                          >
                            <Trash2 className="size-3" />
                          </button>
                        )}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="contact" className="m-0 p-3 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Contact</h2>
              {session && (
                <Dialog open={isContactOpen} onOpenChange={setIsContactOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2 text-black">
                      <Plus className="size-4" /> Add Contact
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="text-black sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Add Contact</DialogTitle>
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
                      <Button type="submit" className="w-full">Add Contact</Button>
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
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-white/50 hover:bg-red-500 hover:text-white"
                        onClick={() => handleDeleteContact(contact.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          </TabsContent>

          <TabsContent value="admin" className="m-0 p-3 sm:p-6">
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
        </ScrollArea>
        </div>
      </Tabs>
    </div>
  )
})

export default SettingsApp
