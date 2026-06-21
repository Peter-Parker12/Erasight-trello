import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

declare global {
  var prisma: PrismaClient | undefined;
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

export const db = globalThis.prisma ?? new PrismaClient({ adapter });

// Always cache — without this, production creates a new connection pool on every request
globalThis.prisma = db;
