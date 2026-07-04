import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()
async function main() {
  const files = await prisma.file.findMany()
  console.log("FILES:", files)
}
main()
