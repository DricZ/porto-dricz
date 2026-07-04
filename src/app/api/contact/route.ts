import { NextResponse } from "next/server"
import { prisma } from "@/lib/auth"
import { redis } from "@/lib/redis"
import nodemailer from "nodemailer"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

// SMTP Configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "localhost",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_PORT === "465",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function POST(req: Request) {
  try {
    const { name, email, message } = await req.json()

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Name, email, and message are required" }, { status: 400 })
    }

    // Rate Limiting using Redis (1 request per hour per IP)
    const headersList = await headers()
    const ip = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "unknown"
    const rateLimitKey = `rate_limit_contact:${ip}`
    
    const hasSentRecently = await redis.get(rateLimitKey)
    if (hasSentRecently) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    }

    // Save to Database
    const contactMessage = await prisma.contactMessage.create({
      data: {
        name,
        email,
        message,
      },
    })

    // Set Rate Limit (1 hour = 3600 seconds)
    await redis.setex(rateLimitKey, 3600, "true")

    // Send Email Notification
    const adminEmail = process.env.ADMIN_EMAIL
    if (adminEmail && process.env.SMTP_USER) {
      try {
        await transporter.sendMail({
          from: process.env.SMTP_FROM || `"Contact Form" <${process.env.SMTP_USER}>`,
          to: adminEmail,
          subject: `New Contact Message from ${name}`,
          text: `You have received a new message from your portfolio contact form.\n\nName: ${name}\nEmail: ${email}\nMessage:\n${message}\n\nSubmitted at: ${contactMessage.createdAt}`,
          html: `<p>You have received a new message from your portfolio contact form.</p><p><strong>Name:</strong> ${name}<br/><strong>Email:</strong> ${email}</p><p><strong>Message:</strong></p><p>${message}</p>`,
        })
      } catch (emailError) {
        console.error("Failed to send email notification:", emailError)
        // Proceed even if email fails
      }
    }

    // Invalidate Cache for all pagination pages
    const keys = await redis.keys("contact_messages_page_*")
    if (keys.length > 0) {
      await redis.del(...keys)
    }

    return NextResponse.json({ success: true, data: contactMessage })
  } catch (error: any) {
    console.error("Contact form error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    // Check Admin Session
    const headersList = await headers()
    const session = await auth.api.getSession({
      headers: headersList
    })

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Pagination Params
    const url = new URL(req.url)
    const page = parseInt(url.searchParams.get("page") || "1", 10)
    const limit = 10
    const skip = (page - 1) * limit

    const cacheKey = `contact_messages_page_${page}`

    // Check Cache
    const cachedData = await redis.get(cacheKey)
    if (cachedData) {
      return NextResponse.json(JSON.parse(cachedData))
    }

    // Fetch from DB if Cache Miss
    const [messages, total] = await Promise.all([
      prisma.contactMessage.findMany({
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.contactMessage.count(),
    ])

    const totalPages = Math.ceil(total / limit)
    
    const responseData = {
      messages,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      }
    }

    // Save to Cache (5 minutes)
    await redis.setex(cacheKey, 300, JSON.stringify(responseData))

    return NextResponse.json(responseData)
  } catch (error) {
    console.error("Failed to fetch contact messages:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
