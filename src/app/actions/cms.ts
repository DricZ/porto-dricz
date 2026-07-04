"use server"

import { prisma } from "@/lib/auth"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { revalidatePath } from "next/cache"

async function requireAuth() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  if (!session) {
    throw new Error("Unauthorized")
  }
  return session
}

// -----------------------------------------------------------------------------
// Projects
// -----------------------------------------------------------------------------
export async function getProjects() {
  return await prisma.project.findMany({ orderBy: { order: "asc" } })
}

export async function createProject(data: {
  name: string
  description: string
  techStack: string[]
  status: string
  year: string
  link?: string | null
  order?: number
}) {
  await requireAuth()
  const project = await prisma.project.create({ data })
  revalidatePath("/")
  return project
}

export async function updateProject(
  id: string,
  data: {
    name?: string
    description?: string
    techStack?: string[]
    status?: string
    year?: string
    link?: string | null
    order?: number
  }
) {
  await requireAuth()
  const project = await prisma.project.update({ where: { id }, data })
  revalidatePath("/")
  return project
}

export async function deleteProject(id: string) {
  await requireAuth()
  await prisma.project.delete({ where: { id } })
  revalidatePath("/")
}

// -----------------------------------------------------------------------------
// Experience
// -----------------------------------------------------------------------------
export async function getExperiences() {
  return await prisma.experience.findMany({ orderBy: { order: "asc" } })
}

export async function createExperience(data: {
  role: string
  company: string
  period: string
  description: string
  order?: number
}) {
  await requireAuth()
  const experience = await prisma.experience.create({ data })
  revalidatePath("/")
  return experience
}

export async function updateExperience(
  id: string,
  data: {
    role?: string
    company?: string
    period?: string
    description?: string
    order?: number
  }
) {
  await requireAuth()
  const experience = await prisma.experience.update({ where: { id }, data })
  revalidatePath("/")
  return experience
}

export async function deleteExperience(id: string) {
  await requireAuth()
  await prisma.experience.delete({ where: { id } })
  revalidatePath("/")
}

// -----------------------------------------------------------------------------
// Skills
// -----------------------------------------------------------------------------
export async function getSkills() {
  return await prisma.skill.findMany({ orderBy: { order: "asc" } })
}

export async function createSkill(data: {
  category: string
  name: string
  order?: number
}) {
  await requireAuth()
  const skill = await prisma.skill.create({ data })
  revalidatePath("/")
  return skill
}

export async function updateSkill(
  id: string,
  data: {
    category?: string
    name?: string
    order?: number
  }
) {
  await requireAuth()
  const skill = await prisma.skill.update({ where: { id }, data })
  revalidatePath("/")
  return skill
}

export async function deleteSkill(id: string) {
  await requireAuth()
  await prisma.skill.delete({ where: { id } })
  revalidatePath("/")
}

// -----------------------------------------------------------------------------
// Contacts
// -----------------------------------------------------------------------------
export async function getContacts() {
  return await prisma.contact.findMany({ orderBy: { order: "asc" } })
}

export async function createContact(data: {
  label: string
  href?: string | null
  iconName: string
  order?: number
}) {
  await requireAuth()
  const contact = await prisma.contact.create({ data })
  revalidatePath("/")
  return contact
}

export async function updateContact(
  id: string,
  data: {
    label?: string
    href?: string | null
    iconName?: string
    order?: number
  }
) {
  await requireAuth()
  const contact = await prisma.contact.update({ where: { id }, data })
  revalidatePath("/")
  return contact
}

export async function deleteContact(id: string) {
  await requireAuth()
  await prisma.contact.delete({ where: { id } })
  revalidatePath("/")
}

// -----------------------------------------------------------------------------
// Settings
// -----------------------------------------------------------------------------
export async function getSettings() {
  const settings = await prisma.setting.findMany()
  return settings.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {} as Record<string, string>)
}

export async function updateSetting(key: string, value: string) {
  await requireAuth()
  const result = await prisma.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  })
  revalidatePath("/")
  return result
}

// -----------------------------------------------------------------------------
// Files
// -----------------------------------------------------------------------------
export async function getFiles(path: string) {
  return await prisma.file.findMany({
    where: { path },
    orderBy: { createdAt: "desc" },
  })
}

export async function createFile(data: { name: string; path: string; url: string; size: number; type: string }) {
  await requireAuth()
  const result = await prisma.file.create({
    data,
  })
  revalidatePath("/")
  return result
}

export async function deleteFile(id: string) {
  await requireAuth()
  const result = await prisma.file.delete({
    where: { id },
  })
  revalidatePath("/")
  return result
}
