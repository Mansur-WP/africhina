import { PrismaClient } from '@prisma/client';

/**
 * Prisma client singleton.
 *
 * In development Next.js clears the module cache on every request (HMR), which
 * would otherwise create a new PrismaClient — and a new connection pool — on
 * each reload until the database refuses connections. Caching the instance on
 * `globalThis` keeps a single client across reloads. In production a fresh
 * module scope is created once, so no global is needed.
 *
 * See: https://www.prisma.io/docs/orm/more/help-and-troubleshooting/nextjs-help
 */
const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
