import { NextResponse } from "next/server"
import { prisma } from "@/lib/auth"
import { redis } from "@/lib/redis"
import { emailQueue } from "@/lib/queue"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

export async function POST(req: Request) {
  try {
    const { name, email, message } = await req.json()

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Name, email, and message are required" }, { status: 400 })
    }

    // Rate Limiting using Redis (max 3 requests per hour per IP)
    const headersList = await headers()
    const ip = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "unknown"
    const rateLimitKey = `rate_limit_contact:${ip}`
    
    const requestCount = await redis.incr(rateLimitKey)
    
    if (requestCount === 1) {
      await redis.expire(rateLimitKey, 3600)
    }
    
    if (requestCount > 3) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 })
    }

    // Save to Database
    const contactMessage = await prisma.contactMessage.create({
      data: {
        name,
        email,
        message,
      },
    })


    // Queue Email Notification
    await emailQueue.add("send-contact-email", {
      name,
      email,
      message,
      createdAt: contactMessage.createdAt,
    })

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
