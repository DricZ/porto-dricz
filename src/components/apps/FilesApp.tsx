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
  FileArchive,
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
import { DESKTOP_ICONS } from "@/components/desktop/DesktopArea"
import { useWindowActions } from "@/stores/useWindowStore"

interface Project {
  id: string
  name: string
  description: string
  techStack: string[]
  status: "completed" | "in-progress" | "maintained"
  year: string
  link?: string | null
}

import {
  getProjects,
  createProject,
  deleteProject,
  getFiles,
  createFile,
  deleteFile,
} from "@/app/actions/cms"

type Directory =
  | "Home"
  | "Portfolio"
  | "Desktop"
  | "Documents"
  | "Downloads"
  | "Music"
  | "Pictures"
  | "Videos"

const HOME_FOLDERS = [
  { id: "Desktop", label: "Desktop", icon: Folder, color: "text-blue-400" },
  {
    id: "Documents",
    label: "Documents",
    icon: FileText,
    color: "text-blue-400",
  },
  {
    id: "Downloads",
    label: "Downloads",
    icon: Download,
    color: "text-blue-400",
  },
  { id: "Music", label: "Music", icon: Music, color: "text-purple-400" },
  {
    id: "Pictures",
    label: "Pictures",
    icon: PictureInPicture,
    color: "text-pink-400",
  },
  {
    id: "Portfolio",
    label: "Portfolio",
    icon: FileCode2,
    color: "text-orange-400",
  },
  { id: "Videos", label: "Videos", icon: Video, color: "text-emerald-400" },
]

const SIDEBAR_ITEMS = [
  { id: "Home", label: "Home", icon: Home },
  { id: "Desktop", label: "Desktop", icon: Folder },
  { id: "Documents", label: "Documents", icon: FileText },
  { id: "Downloads", label: "Downloads", icon: Download },
  { id: "Music", label: "Music", icon: Music },
  { id: "Pictures", label: "Pictures", icon: PictureInPicture },
  { id: "Portfolio", label: "Portfolio", icon: FileCode2 },
  { id: "Videos", label: "Videos", icon: Video },
] as const

const getFileIcon = (type: string) => {
  if (!type)
    return (
      <FileText
        size={48}
        className="mb-3 text-white/80 drop-shadow-md"
        strokeWidth={1}
      />
    )
  if (type.startsWith("video/"))
    return (
      <Video
        size={48}
        className="mb-3 text-emerald-400 drop-shadow-md"
        strokeWidth={1}
      />
    )
  if (type.startsWith("audio/"))
    return (
      <Music
        size={48}
        className="mb-3 text-purple-400 drop-shadow-md"
        strokeWidth={1}
      />
    )
  if (type === "application/pdf")
    return (
      <FileText
        size={48}
        className="mb-3 text-red-400 drop-shadow-md"
        strokeWidth={1}
      />
    )
  if (
    type.includes("zip") ||
    type.includes("tar") ||
    type.includes("compressed") ||
    type.includes("rar")
  )
    return (
      <FileArchive
        size={48}
        className="mb-3 text-yellow-400 drop-shadow-md"
        strokeWidth={1}
      />
    )
  if (
    type.includes("json") ||
    type.includes("javascript") ||
    type.includes("typescript") ||
    type.includes("html") ||
    type.includes("css") ||
    type.includes("xml") ||
    type.includes("csv")
  )
    return (
      <FileCode2
        size={48}
        className="mb-3 text-blue-400 drop-shadow-md"
        strokeWidth={1}
      />
    )
  return (
    <FileText
      size={48}
      className="mb-3 text-white/80 drop-shadow-md"
      strokeWidth={1}
    />
  )
}

const STATUS_STYLES: Record<Project["status"], string> = {
  completed: "!bg-emerald-500/10 !text-emerald-400 !border-emerald-500/20",
  "in-progress": "!bg-blue-500/10 !text-blue-400 !border-blue-500/20",
  maintained: "!bg-orange-500/10 !text-orange-400 !border-orange-500/20",
}

export const FilesApp = memo(function FilesApp({
  window,
}: {
  window?: WindowState
}) {
  const [currentDir, setCurrentDir] = useState<Directory>(
    (window?.initialData?.directory as Directory) || "Home"
  )
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [files, setFiles] = useState<any[]>([])
  const [isLoadingFiles, setIsLoadingFiles] = useState(false)

  const { data: session } = useSession()

  const [isProjectOpen, setIsProjectOpen] = useState(false)
  const [projectForm, setProjectForm] = useState({
    name: "",
    description: "",
    techStack: "",
    status: "completed",
    year: "",
    link: "",
  })
  const { openWindow } = useWindowActions()

  useEffect(() => {
    let mounted = true
    getProjects().then((data) => {
      if (mounted) setProjects(data as Project[])
    })
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (
      currentDir !== "Home" &&
      currentDir !== "Portfolio" &&
      currentDir !== "Desktop"
    ) {
      let mounted = true
      setIsLoadingFiles(true)
      getFiles(currentDir).then((data) => {
        if (mounted) {
          setFiles(data)
          setIsLoadingFiles(false)
        }
      })
      return () => {
        mounted = false
      }
    } else {
      setFiles([])
    }
  }, [currentDir])

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
      techStack: projectForm.techStack
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      status: projectForm.status,
      year: projectForm.year,
      link: projectForm.link || undefined,
    })
    setProjects((prev) => [...prev, newProject as Project])
    setIsProjectOpen(false)
    setProjectForm({
      name: "",
      description: "",
      techStack: "",
      status: "completed",
      year: "",
      link: "",
    })
  }

  const handleDeleteProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm("Are you sure you want to delete this project?")) return
    await deleteProject(id)
    setProjects((prev) => prev.filter((x) => x.id !== id))
    if (selectedProject?.id === id) {
      setSelectedProject(null)
    }
  }
  const handleDeleteFile = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm("Are you sure you want to delete this file?")) return
    await deleteFile(id)
    setFiles((prev) => prev.filter((x) => x.id !== id))
  }
  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      })

      const { presignedUrl, key, url } = await res.json()
      if (presignedUrl) {
        await fetch(presignedUrl, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type },
        })

        const newFile = await createFile({
          name: file.name,
          path: currentDir,
          url,
          size: file.size,
          type: file.type,
        })

        setFiles((prev) => [newFile, ...prev])

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
      <div className="hidden h-full w-44 shrink-0 flex-col gap-1 border-r border-white/10 bg-[#252525] p-2 sm:flex">
        <div className="mb-2 px-2 text-xs font-medium text-white/50">
          Bookmarks
        </div>
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
                <button className="mr-1 transition-colors hover:text-white sm:hidden">
                  <Menu size={16} />
                </button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-64 border-white/10 bg-[#252525] p-2 text-white"
              >
                <SheetHeader className="mb-2 px-2 text-left">
                  <SheetTitle className="text-xs font-medium text-white/50">
                    Bookmarks
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-1">
                  {SIDEBAR_ITEMS.map(({ id, label, icon: Icon }) => (
                    <SheetTrigger asChild key={id}>
                      <button
                        onClick={() => handleNavigate(id)}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors",
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
              className="transition-colors hover:text-white"
            >
              Home
            </button>
            {currentDir !== "Home" && (
              <>
                <ChevronRight size={14} />
                <button
                  onClick={() => handleNavigate(currentDir)}
                  className={cn(
                    "transition-colors hover:text-white",
                    !selectedProject && "font-medium text-white"
                  )}
                >
                  {currentDir}
                </button>
              </>
            )}
            {selectedProject && (
              <>
                <ChevronRight size={14} />
                <span className="font-medium text-white">
                  {selectedProject.name}
                </span>
              </>
            )}
          </div>

          {/* Directory Content */}
          <ScrollArea className="flex-1 p-4">
            {currentDir === "Home" && (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-2 sm:grid-cols-[repeat(auto-fill,minmax(100px,1fr))] sm:gap-4">
                {HOME_FOLDERS.map((folder) => (
                  <button
                    key={folder.id}
                    onClick={() => {
                      if (
                        typeof globalThis.window !== "undefined" &&
                        globalThis.innerWidth < 640
                      ) {
                        handleNavigate(folder.id)
                      }
                    }}
                    onDoubleClick={() => handleNavigate(folder.id)}
                    className="group flex flex-col items-center gap-3 rounded-xl p-3 transition-colors hover:bg-white/10 focus:bg-blue-500/20 focus:outline-none"
                  >
                    <div
                      className={cn(
                        "flex items-center justify-center p-1 transition-transform group-hover:scale-105 group-active:scale-95",
                        folder.color
                      )}
                    >
                      <folder.icon
                        size={46}
                        strokeWidth={1.5}
                        fill="currentColor"
                        style={{ fillOpacity: 0.2 }}
                      />
                    </div>
                    <span className="line-clamp-2 px-1 text-center text-xs leading-tight break-words text-white/90">
                      {folder.label}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {currentDir === "Desktop" && (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-2 sm:grid-cols-[repeat(auto-fill,minmax(100px,1fr))] sm:gap-4">
                {DESKTOP_ICONS.map((item) => {
                  const initialData =
                    item.id === "portfolios"
                      ? { directory: "Portfolio" }
                      : undefined
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        if (
                          typeof globalThis.window !== "undefined" &&
                          globalThis.innerWidth < 640
                        ) {
                          openWindow(item.appId, initialData)
                        }
                      }}
                      onDoubleClick={() => openWindow(item.appId, initialData)}
                      className="group flex flex-col items-center gap-3 rounded-xl p-3 transition-colors hover:bg-white/10 focus:bg-blue-500/20 focus:outline-none"
                    >
                      <div className="flex items-center justify-center p-1 text-blue-400 transition-transform group-hover:scale-105 group-active:scale-95">
                        <item.icon
                          size={46}
                          strokeWidth={1.5}
                          fill="currentColor"
                          style={{ fillOpacity: 0.2 }}
                        />
                      </div>
                      <span className="line-clamp-2 px-1 text-center text-xs leading-tight break-words text-white/90">
                        {item.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}

            {currentDir === "Portfolio" && !selectedProject && (
              <>
                {session && (
                  <div className="mb-4">
                    <Dialog
                      open={isProjectOpen}
                      onOpenChange={setIsProjectOpen}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2 text-black"
                        >
                          <Plus className="size-4" /> New Project
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="text-black sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Add Project</DialogTitle>
                        </DialogHeader>
                        <form
                          onSubmit={handleAddProject}
                          className="space-y-4 pt-4"
                        >
                          <div className="space-y-2">
                            <Label>Name</Label>
                            <Input
                              required
                              value={projectForm.name}
                              onChange={(e) =>
                                setProjectForm({
                                  ...projectForm,
                                  name: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea
                              required
                              rows={3}
                              value={projectForm.description}
                              onChange={(e) =>
                                setProjectForm({
                                  ...projectForm,
                                  description: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Tech Stack (comma separated)</Label>
                            <Input
                              required
                              value={projectForm.techStack}
                              onChange={(e) =>
                                setProjectForm({
                                  ...projectForm,
                                  techStack: e.target.value,
                                })
                              }
                              placeholder="React, Node.js, ..."
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Status</Label>
                              <select
                                required
                                value={projectForm.status}
                                onChange={(e) =>
                                  setProjectForm({
                                    ...projectForm,
                                    status: e.target.value,
                                  })
                                }
                                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <option value="completed">Completed</option>
                                <option value="in-progress">In Progress</option>
                                <option value="maintained">Maintained</option>
                              </select>
                            </div>
                            <div className="space-y-2">
                              <Label>Year</Label>
                              <Input
                                required
                                value={projectForm.year}
                                onChange={(e) =>
                                  setProjectForm({
                                    ...projectForm,
                                    year: e.target.value,
                                  })
                                }
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Link (optional)</Label>
                            <Input
                              value={projectForm.link}
                              onChange={(e) =>
                                setProjectForm({
                                  ...projectForm,
                                  link: e.target.value,
                                })
                              }
                              placeholder="https://..."
                            />
                          </div>
                          <Button type="submit" className="w-full">
                            Create Project
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
                  {projects.map((project) => (
                    <div
                      key={project.id}
                      onClick={() => {
                        if (
                          typeof globalThis.window !== "undefined" &&
                          globalThis.innerWidth < 640
                        ) {
                          handleSelectProject(project)
                        }
                      }}
                      onDoubleClick={() => handleSelectProject(project)}
                      className="group relative flex h-32 cursor-pointer flex-col justify-between rounded-xl border border-white/10 bg-white/5 p-4 text-left transition-colors hover:bg-white/10 focus:bg-blue-500/20 focus:outline-none"
                    >
                      {session && (
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 z-10 h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
                          onClick={(e) => handleDeleteProject(project.id, e)}
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      )}
                      <div>
                        <div className="flex items-start justify-between">
                          <Folder
                            className="text-blue-400"
                            size={28}
                            strokeWidth={1.5}
                            fill="currentColor"
                            style={{ fillOpacity: 0.2 }}
                          />
                          <Badge
                            variant="outline"
                            className={cn(
                              STATUS_STYLES[
                                project.status as keyof typeof STATUS_STYLES
                              ],
                              "text-[10px]",
                              session && "mr-8"
                            )}
                          >
                            {project.status.replace("-", " ")}
                          </Badge>
                        </div>
                        <h3 className="mt-3 line-clamp-1 font-medium text-white/90">
                          {project.name}
                        </h3>
                        <p className="mt-1 line-clamp-2 text-xs text-white/50">
                          {project.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {currentDir !== "Home" &&
              currentDir !== "Portfolio" &&
              currentDir !== "Desktop" && (
                <>
                  {isLoadingFiles ? (
                    <div className="flex h-full min-h-[300px] flex-col items-center justify-center text-center text-white/50">
                      <p className="mt-1 text-sm">Loading files...</p>
                    </div>
                  ) : files.length > 0 ? (
                    <div className="grid animate-in grid-cols-2 gap-4 p-2 fade-in slide-in-from-bottom-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                      {files.map((file) => (
                        <div
                          key={file.id}
                          className="group relative flex cursor-pointer flex-col items-center rounded-lg p-4 transition-all hover:bg-white/10"
                          onClick={() => {
                            if (file.url) {
                              if (
                                file.type.startsWith("video/") ||
                                file.type.startsWith("audio/")
                              ) {
                                openWindow("mediaplayer", {
                                  fileUrl: file.url,
                                  fileName: file.name,
                                  fileType: file.type,
                                })
                              } else if (file.type === "application/pdf") {
                                openWindow("pdfviewer", {
                                  fileUrl: file.url,
                                  fileName: file.name,
                                  fileType: file.type,
                                })
                              } else {
                                globalThis.open(file.url, "_blank")
                              }
                            }
                          }}
                        >
                          {session && (
                            <Button
                              variant="destructive"
                              size="icon"
                              className="absolute top-2 right-2 z-10 h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
                              onClick={(e) => handleDeleteFile(file.id, e)}
                            >
                              <Trash2 className="size-3" />
                            </Button>
                          )}

                          {file.type.startsWith("image/") ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={file.url}
                              alt={file.name}
                              className="mb-3 h-12 w-12 rounded object-cover shadow-md"
                            />
                          ) : (
                            getFileIcon(file.type)
                          )}

                          <span className="line-clamp-2 max-w-full text-center text-xs font-medium break-all text-white/90">
                            {file.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex h-full min-h-[300px] flex-col items-center justify-center text-center text-white/50">
                      <Folder
                        size={64}
                        className="mb-4 text-white/20"
                        strokeWidth={1}
                      />
                      <h3 className="text-lg font-medium text-white/70">
                        Folder is empty
                      </h3>
                      <p className="mt-1 text-sm">
                        You can add files to{" "}
                        <span className="font-semibold text-white/90">
                          {currentDir}
                        </span>{" "}
                        later.
                      </p>
                    </div>
                  )}
                </>
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
                        <a
                          href={selectedProject.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-400 hover:underline"
                        >
                          View Project
                        </a>
                      )}
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      STATUS_STYLES[
                        selectedProject.status as keyof typeof STATUS_STYLES
                      ]
                    }
                  >
                    {selectedProject.status.replace("-", " ")}
                  </Badge>
                </div>

                <Separator className="my-6 bg-white/10" />

                <div className="space-y-6">
                  <section>
                    <h3 className="text-sm font-medium text-white/70">
                      Overview
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap text-white/90">
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
          <ContextMenuContent className="w-48 rounded-lg border-white/10 bg-[#2b2b2b]/95 p-1 text-sm text-white/90 shadow-2xl backdrop-blur-md">
            <ContextMenuItem
              className="cursor-default rounded-md px-3 py-1.5 transition-colors hover:bg-white/10"
              onClick={() => {
                const input = document.createElement("input")
                input.type = "file"
                input.onchange = (e) => handleUploadFile(e as any)
                input.click()
              }}
            >
              Upload File...
            </ContextMenuItem>
            <ContextMenuSeparator className="my-1 bg-white/10" />
            <ContextMenuItem
              className="cursor-default rounded-md px-3 py-1.5 text-white/50 transition-colors hover:bg-white/10"
              disabled
            >
              New Folder
            </ContextMenuItem>
          </ContextMenuContent>
        )}
      </ContextMenu>
    </div>
  )
})

export default FilesApp
