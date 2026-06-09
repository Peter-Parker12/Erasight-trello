import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

declare global {
  var prisma: PrismaClient | undefined;
}

console.log("[db] DATABASE_URL host:", process.env.DATABASE_URL?.match(/@([^:/]+)/)?.[1]);
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

export const db = globalThis.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalThis.prisma = db;
