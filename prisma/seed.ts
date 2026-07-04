import { PrismaClient } from "@prisma/client"
import { Pool } from "pg"
import { PrismaPg } from "@prisma/adapter-pg"
import dotenv from "dotenv"

dotenv.config()
const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASS || "",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME || "porto_db",
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("Seeding CMS data...")

  // Seed Projects
  const projects = [
    {
      name: "Enterprise ERP Backend",
      description: "A comprehensive backend system handling inventory, finance, and HR modules for multi-branch operations. Built with clean architecture and event-driven patterns for high throughput.",
      techStack: ["Go", "Gin", "PostgreSQL", "Docker", "gRPC"],
      status: "maintained",
      year: "2024",
      order: 1,
    },
    {
      name: "Headless POS System",
      description: "A headless point-of-sale system with real-time sync, offline-first capabilities, and multi-terminal support. REST API backend serving web and mobile clients.",
      techStack: ["Laravel", "Redis", "REST API", "MySQL", "WebSocket"],
      status: "completed",
      year: "2024",
      order: 2,
    },
    {
      name: "Access Control Integration",
      description: "IoT-based access control system integrating RFID readers, biometric scanners, and CCTV. Runs on Proxmox-virtualized infrastructure with MQTT message bus.",
      techStack: ["IoT", "MQTT", "Proxmox", "Docker", "Node.js"],
      status: "completed",
      year: "2023",
      order: 3,
    },
    {
      name: "Analytics Dashboard",
      description: "Real-time business intelligence dashboard with dynamic charting, report generation, and role-based access. Integrates multiple data sources for unified metrics.",
      techStack: ["React", "TypeScript", "Chart.js", "Tailwind CSS"],
      status: "in-progress",
      year: "2025",
      order: 4,
    },
  ]

  for (const project of projects) {
    await prisma.project.create({ data: project })
  }

  // Seed Experience
  const experiences = [
    {
      role: "Information Technology Specialist",
      company: "PT. United Shipping Indonesia",
      period: "Aug 2024 - Nov 2025",
      description: "Provided technical support resolving 96.7% of tickets within SLA. Implemented security measures, managed network infrastructure (routers, switches, firewalls). Upgraded hardware and optimized website performance using Laravel and React JS.",
      order: 1,
    },
    {
      role: "Freelance - Head of IT",
      company: "CV. Solusi Digital Internasional (Nadrical)",
      period: "Dec 2020 - Present",
      description: "Led development of web and mobile applications using Laravel, React JS, and React Native. Architected scalable systems, managed SDLC, and oversaw Linux server infrastructure.",
      order: 2,
    },
    {
      role: "Full Stack Developer",
      company: "PT. Pilar Dinamika Integra (DINAMIGRA)",
      period: "Jan 2024 - Jun 2024",
      description: "Configured ERP systems, created custom SQL reports, integrated RESTful APIs, and designed database schemas ensuring data integrity.",
      order: 3,
    },
    {
      role: "Internship - Full Stack Developer",
      company: "PT. Pilar Dinamika Integra (DINAMIGRA)",
      period: "May 2023 - Oct 2023",
      description: "Implemented responsive designs, optimized website performance, implemented OAuth/JWT authentication, and increased application security.",
      order: 4,
    },
    {
      role: "Frontend Developer",
      company: "Carist Corporation",
      period: "Feb 2022 - May 2022",
      description: "Developed app solutions using JavaScript, CSS, PHP, and HTML. Collaborated with backend developers to design APIs and strategically planned future products.",
      order: 5,
    },
    {
      role: "Accounting Assistant",
      company: "TS Accounting & Tax Consulting",
      period: "Aug 2020 - Oct 2021",
      description: "Provided clerical support, monitored accounts receivable/payable, reconciled company accounts, and helped prepare month-end/year-end closings.",
      order: 6,
    },
    {
      role: "IT Support",
      company: "TS Accounting & Tax Consulting",
      period: "Jun 2019 - Aug 2020",
      description: "Resolved desktop issues, assigned system permissions, managed backups, and trained customers on new product offerings.",
      order: 7,
    }
  ]

  for (const exp of experiences) {
    await prisma.experience.create({ data: exp })
  }

  // Seed Skills
  const skillsData = {
    Frontend: ["React JS", "React Native", "Next JS", "JavaScript", "HTML", "CSS"],
    Backend: ["PHP", "Laravel", "Node JS", "Express JS", "CodeIgniter 3", "Java", "Kotlin", "Python", "Go", "REST API", "WebSocket"],
    Infrastructure: ["Linux", "Ubuntu", "CentOS", "Kali", "Networking", "Firewall", "Redis"],
    SoftSkills: ["Leadership", "Teamwork", "Time management", "Critical Thinking", "Problem Solving", "Willingness to Learn"]
  }

  let skillOrder = 1
  for (const [category, skills] of Object.entries(skillsData)) {
    for (const name of skills) {
      await prisma.skill.create({
        data: {
          category,
          name,
          order: skillOrder++,
        },
      })
    }
  }

  // Seed Contacts
  const contacts = [
    { label: "drcsm2013@gmail.com", href: "mailto:drcsm2013@gmail.com", iconName: "Mail", order: 1 },
    { label: "+628970423908", href: "tel:+628970423908", iconName: "Phone", order: 2 },
    { label: "linkedin.com/in/audrico", href: "https://www.linkedin.com/in/audrico-98797017a", iconName: "Linkedin", order: 3 },
    { label: "nadrical.my.id", href: "https://nadrical.my.id", iconName: "Globe", order: 4 },
  ]

  for (const contact of contacts) {
    await prisma.contact.create({ data: contact })
  }

  // Seed Profile
  const profileSettings = [
    { key: "name", value: "AUDRICO" },
    { key: "title", value: "Full Stack Developer" },
    { key: "location", value: "Surabaya, Indonesia" },
    { key: "bio", value: "Well-qualified Full Stack Developer familiar with wide range of programming utilities and languages. Knowledgeable of backend and frontend development requirements. Handles any part of process with ease. Collaborative team player with excellent technical abilities offering 5 years of related experience." },
  ]

  // Seed Settings
  for (const setting of profileSettings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: { key: setting.key, value: setting.value },
    })
  }

  console.log("Seeding Admin User...")
  try {
    const { auth } = await import("../src/lib/auth");
    // Ensure we don't duplicate the user if they already exist
    const existingUser = await prisma.user.findUnique({
      where: { email: "admin@porto.dev" }
    });
    
    if (!existingUser) {
      await auth.api.signUpEmail({
        body: {
          email: "admin@porto.dev",
          password: "admin123",
          name: "Admin"
        },
        asResponse: false
      });
      console.log("Admin User created (admin@porto.dev / admin123)");
    } else {
      console.log("Admin User already exists (admin@porto.dev)");
    }
  } catch (err) {
    console.error("Failed to seed admin user:", err);
  }

  console.log("Seeding complete.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
