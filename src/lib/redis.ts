import Redis from "ioredis"

declare global {
  var redis: Redis | undefined
}

export const redis =
  global.redis ||
  new Redis({
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379", 10),
    password: process.env.REDIS_PASS || undefined,
    maxRetriesPerRequest: null,
  })

if (process.env.NODE_ENV !== "production") {
  global.redis = redis
}
