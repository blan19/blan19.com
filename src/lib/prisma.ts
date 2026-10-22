import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

declare global {
  var prisma: PrismaClient | undefined;
}

const createClient = () =>
  new PrismaClient({
    adapter: new PrismaPg({
      connectionString: process.env.POSTGRES_PRISMA_URL,
      // Neon rejects non-TLS connections; node-postgres does not use TLS
      // unless asked (an sslmode in the URL still takes precedence)
      ssl: true,
    }),
  });

const prisma = global.prisma || createClient();

if (process.env.NODE_ENV === "development") global.prisma = prisma;

export default prisma;
