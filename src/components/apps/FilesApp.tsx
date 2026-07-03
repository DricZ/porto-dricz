import { memo, useCallback, useState, useEffect } from "react"
import type { WindowState } from "@/types"
import {
  ChevronRight,
  FileText,
  Folder,
  Home,
  Music,
  PictureInPicture,
  Star,
  Video,
  Download,
  FileCode2,
  Plus,
  Trash2,
  Pencil,
  Menu,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
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
import { cn } from "@/lib/utils"
import { useSession } from "@/lib/auth-client"

interface Project {
  id: string
  name: string
  description: string
  techStack: string[]
  status: "completed" | "in-progress" | "maintained"
  year: string
  link?: string | null
}

import { getProjects, createProject, deleteProject } from "@/app/actions/cms"

type Directory = "Home" | "Portofolio" | "Desktop" | "Documents" | "Downloads" | "Music" | "Pictures" | "Videos"

const HOME_FOLDERS = [
  { id: "Desktop", label: "Desktop", icon: Folder, color: "text-blue-400" },
  { id: "Documents", label: "Documents", icon: FileText, color: "text-blue-400" },
  { id: "Downloads", label: "Downloads", icon: Download, color: "text-blue-400" },
  { id: "Music", label: "Music", icon: Music, color: "text-purple-400" },
  { id: "Pictures", label: "Pictures", icon: PictureInPicture, color: "text-pink-400" },
  { id: "Portofolio", label: "Portofolio", icon: FileCode2, color: "text-orange-400" },
  { id: "Videos", label: "Videos", icon: Video, color: "text-emerald-400" },
]

const SIDEBAR_ITEMS = [
  { id: "Home", label: "Home", icon: Home },
  { id: "Desktop", label: "Desktop", icon: Folder },
  { id: "Documents", label: "Documents", icon: FileText },
  { id: "Downloads", label: "Downloads", icon: Download },
  { id: "Music", label: "Music", icon: Music },
  { id: "Pictures", label: "Pictures", icon: PictureInPicture },
  { id: "Portofolio", label: "Portofolio", icon: FileCode2 },
  { id: "Videos", label: "Videos", icon: Video },
] as const

const STATUS_STYLES: Record<Project["status"], string> = {
  completed: "!bg-emerald-500/10 !text-emerald-400 !border-emerald-500/20",
  "in-progress": "!bg-blue-500/10 !text-blue-400 !border-blue-500/20",
  maintained: "!bg-orange-500/10 !text-orange-400 !border-orange-500/20",
}

export const FilesApp = memo(function FilesApp({ window }: { window?: WindowState }) {
  const [currentDir, setCurrentDir] = useState<Directory>(
    (window?.initialData?.directory as Directory) || "Home"
  )
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [projects, setProjects] = useState<Project[]>([])

  const { data: session } = useSession()

  const [isProjectOpen, setIsProjectOpen] = useState(false)
  const [projectForm, setProjectForm] = useState({ name: "", description: "", techStack: "", status: "completed", year: "", link: "" })

  useEffect(() => {
    let mounted = true
    getProjects().then((data) => {
      if (mounted) setProjects(data as Project[])
    })
    return () => {
      mounted = false
    }
  }, [])

  const handleSelectProject = useCallback((project: Project) => {
    setSelectedProject(project)
  }, [])

  const handleNavigate = useCallback((dir: string) => {
    setCurrentDir(dir as Directory)
    setSelectedProject(null)
  }, [])

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault()
    const newProject = await createProject({
      name: projectForm.name,
      description: projectForm.description,
      techStack: projectForm.techStack.split(",").map(t => t.trim()).filter(Boolean),
      status: projectForm.status,
      year: projectForm.year,
      link: projectForm.link || undefined,
    })
    setProjects(prev => [...prev, newProject as Project])
    setIsProjectOpen(false)
    setProjectForm({ name: "", description: "", techStack: "", status: "completed", year: "", link: "" })
  }
  
  const handleDeleteProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm("Are you sure you want to delete this project?")) return
    await deleteProject(id)
    setProjects(prev => prev.filter(x => x.id !== id))
    if (selectedProject?.id === id) {
      setSelectedProject(null)
    }
  }

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type })
      })
      
      const { presignedUrl } = await res.json()
      if (presignedUrl) {
        await fetch(presignedUrl, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type }
        })
        alert("File uploaded successfully!")
      } else {
        alert("Failed to get upload URL.")
      }
    } catch (err) {
      console.error(err)
      alert("Upload failed.")
    }
  }

  return (
    <div className="flex h-full bg-[#1e1e1e] text-white">
      {/* Sidebar — hidden on mobile since windows auto-fullscreen */}
      <div className="hidden sm:flex h-full w-44 shrink-0 flex-col gap-1 border-r border-white/10 bg-[#252525] p-2">
        <div className="mb-2 px-2 text-xs font-medium text-white/50">Bookmarks</div>
        {SIDEBAR_ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => handleNavigate(id)}
            className={cn(
              "flex items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors",
              currentDir === id && !selectedProject
                ? "bg-blue-500/20 text-blue-400"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            )}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Main content */}
      <ContextMenu>
        <ContextMenuTrigger className="flex flex-1 flex-col overflow-hidden">
          {/* Breadcrumb */}
        <div className="flex h-9 shrink-0 items-center gap-1 border-b border-white/10 px-3 text-xs text-white/60">
          <Sheet>
            <SheetTrigger asChild>
              <button className="sm:hidden mr-1 hover:text-white transition-colors">
                <Menu size={16} />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 bg-[#252525] border-white/10 text-white p-2">
              <SheetHeader className="mb-2 px-2 text-left">
                <SheetTitle className="text-xs font-medium text-white/50">Bookmarks</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-1">
                {SIDEBAR_ITEMS.map(({ id, label, icon: Icon }) => (
                  <SheetTrigger asChild key={id}>
                    <button
                      onClick={() => handleNavigate(id)}
                      className={cn(
                        "flex items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors w-full text-left",
                        currentDir === id && !selectedProject
                          ? "bg-blue-500/20 text-blue-400"
                          : "text-white/70 hover:bg-white/10 hover:text-white"
                      )}
                    >
                      <Icon size={14} />
                      {label}
                    </button>
                  </SheetTrigger>
                ))}
              </div>
            </SheetContent>
          </Sheet>

          <button
            onClick={() => handleNavigate("Home")}
            className="hover:text-white transition-colors"
          >
            Home
          </button>
          {currentDir !== "Home" && (
            <>
              <ChevronRight size={14} />
              <button
                onClick={() => handleNavigate(currentDir)}
                className={cn(
                  "hover:text-white transition-colors",
                  !selectedProject && "text-white font-medium"
                )}
              >
                {currentDir}
              </button>
            </>
          )}
          {selectedProject && (
            <>
              <ChevronRight size={14} />
              <span className="text-white font-medium">{selectedProject.name}</span>
            </>
          )}
        </div>

        {/* Directory Content */}
        <ScrollArea className="flex-1 p-4">
          {currentDir === "Home" && (
            <div className="grid grid-cols-4 gap-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8">
              {HOME_FOLDERS.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => {
                    if (window.innerWidth < 640) {
                      handleNavigate(folder.id)
                    }
                  }}
                  onDoubleClick={() => handleNavigate(folder.id)}
                  className="flex flex-col items-center gap-2 rounded-lg p-3 hover:bg-white/10 focus:bg-blue-500/20 focus:outline-none transition-colors group"
                >
                  <folder.icon size={48} className={cn("transition-transform group-hover:scale-105 group-active:scale-95", folder.color)} strokeWidth={1.5} />
                  <span className="text-xs text-white/90 truncate w-full text-center">{folder.label}</span>
                </button>
              ))}
            </div>
          )}

          {currentDir === "Portofolio" && !selectedProject && (
            <>
              {session && (
                <div className="mb-4">
                  <Dialog open={isProjectOpen} onOpenChange={setIsProjectOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2 text-black">
                        <Plus className="size-4" /> New Project
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="text-black sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Add Project</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleAddProject} className="space-y-4 pt-4">
                        <div className="space-y-2">
                          <Label>Name</Label>
                          <Input required value={projectForm.name} onChange={e => setProjectForm({...projectForm, name: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Textarea required rows={3} value={projectForm.description} onChange={e => setProjectForm({...projectForm, description: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <Label>Tech Stack (comma separated)</Label>
                          <Input required value={projectForm.techStack} onChange={e => setProjectForm({...projectForm, techStack: e.target.value})} placeholder="React, Node.js, ..." />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Status</Label>
                            <select 
                              required 
                              value={projectForm.status} 
                              onChange={e => setProjectForm({...projectForm, status: e.target.value})}
                              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <option value="completed">Completed</option>
                              <option value="in-progress">In Progress</option>
                              <option value="maintained">Maintained</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <Label>Year</Label>
                            <Input required value={projectForm.year} onChange={e => setProjectForm({...projectForm, year: e.target.value})} />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Link (optional)</Label>
                          <Input value={projectForm.link} onChange={e => setProjectForm({...projectForm, link: e.target.value})} placeholder="https://..." />
                        </div>
                        <Button type="submit" className="w-full">Create Project</Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
                {projects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => {
                      if (window.innerWidth < 640) {
                        handleSelectProject(project)
                      }
                    }}
                    onDoubleClick={() => handleSelectProject(project)}
                    className="group relative flex h-32 flex-col justify-between rounded-xl border border-white/10 bg-white/5 p-4 text-left transition-colors hover:bg-white/10 focus:bg-blue-500/20 focus:outline-none"
                  >
                    {session && (
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute right-2 top-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        onClick={(e) => handleDeleteProject(project.id, e)}
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    )}
                    <div>
                      <div className="flex items-start justify-between">
                        <Folder className="text-blue-400" size={24} />
                        <Badge variant="outline" className={cn(STATUS_STYLES[project.status as keyof typeof STATUS_STYLES], "text-[10px]", session && "mr-8")}>
                          {project.status.replace("-", " ")}
                        </Badge>
                      </div>
                      <h3 className="mt-3 font-medium text-white/90 line-clamp-1">
                        {project.name}
                      </h3>
                      <p className="mt-1 text-xs text-white/50 line-clamp-2">
                        {project.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {currentDir !== "Home" && currentDir !== "Portofolio" && (
            <div className="flex h-full min-h-[300px] flex-col items-center justify-center text-center text-white/50">
              <Folder size={64} className="mb-4 text-white/20" strokeWidth={1} />
              <h3 className="text-lg font-medium text-white/70">Folder is empty</h3>
              <p className="mt-1 text-sm">
                You can add files to <span className="font-semibold text-white/90">{currentDir}</span> later.
              </p>
            </div>
          )}

          {selectedProject && (
            <div className="mx-auto max-w-2xl animate-in fade-in slide-in-from-bottom-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white/90">
                    {selectedProject.name}
                  </h2>
                  <div className="mt-1 flex items-center gap-4 text-sm text-white/50">
                    <span>Year: {selectedProject.year}</span>
                    {selectedProject.link && (
                      <a href={selectedProject.link} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline inline-flex items-center gap-1">
                        View Project
                      </a>
                    )}
                  </div>
                </div>
                <Badge variant="outline" className={STATUS_STYLES[selectedProject.status as keyof typeof STATUS_STYLES]}>
                  {selectedProject.status.replace("-", " ")}
                </Badge>
              </div>

              <Separator className="my-6 bg-white/10" />

              <div className="space-y-6">
                <section>
                  <h3 className="text-sm font-medium text-white/70">Overview</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/90 whitespace-pre-wrap">
                    {selectedProject.description}
                  </p>
                </section>

                <section>
                  <h3 className="text-sm font-medium text-white/70">
                    Technologies Used
                  </h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedProject.techStack.map((tech) => (
                      <Badge
                        key={tech}
                        variant="secondary"
                        className="bg-white/10 text-white/80 hover:bg-white/20"
                      >
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          )}
        </ScrollArea>
        </ContextMenuTrigger>
        {session && (
          <ContextMenuContent className="w-48 bg-[#2b2b2b]/95 text-white/90 border-white/10 backdrop-blur-md shadow-2xl p-1 rounded-lg text-sm">
            <ContextMenuItem className="hover:bg-white/10 cursor-default py-1.5 px-3 rounded-md transition-colors" onClick={() => {
              const input = document.createElement('input')
              input.type = 'file'
              input.onchange = (e) => handleUploadFile(e as any)
              input.click()
            }}>
              Upload File...
            </ContextMenuItem>
            <ContextMenuSeparator className="bg-white/10 my-1" />
            <ContextMenuItem className="hover:bg-white/10 cursor-default py-1.5 px-3 rounded-md transition-colors text-white/50" disabled>
              New Folder
            </ContextMenuItem>
          </ContextMenuContent>
        )}
      </ContextMenu>
    </div>
  )
})

export default FilesApp
