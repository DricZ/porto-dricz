import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { composeDatabaseUrl, getDatabasePoolConfig } from "@/lib/db-config";

const dbUrl = composeDatabaseUrl(process.env, { forPrisma: true });
const pool = new Pool(
  dbUrl
    ? { connectionString: dbUrl }
    : getDatabasePoolConfig(process.env)
);
const adapter = new PrismaPg(pool);
export const prisma = new PrismaClient({ adapter });

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    changeEmail: {
      enabled: true,
    },
  },
});
