import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

/**
 * Prisma Client Singleton
 * 
 * Connection Pooling:
 * - In development: Uses direct connection
 * - In production with Vercel/Neon: Use DATABASE_URL with ?sslmode=require and pgBouncer (pooling_mode=transaction)
 * - Alternatively set DIRECT_DATABASE_URL for direct connections and DATABASE_URL for pooled connections
 * 
 * The singleton pattern ensures only one PrismaClient instance per process,
 * which is critical for connection pooling efficiency.
 */
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma