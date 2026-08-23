import { PrismaClient } from '@prisma/client';
import { config } from './env.js';

// PrismaClient singleton declaration
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: config.isDevelopment ? ['query', 'error', 'warn'] : ['error'],
  });

if (config.isDevelopment) {
  globalForPrisma.prisma = prisma;
}

/**
 * Checks connectivity to PostgreSQL database
 * Returns connection state without crashing server if DB is unavailable
 */
export async function checkDatabaseConnection(): Promise<{
  connected: boolean;
  error?: string;
}> {
  try {
    // Attempt a lightweight query
    await prisma.$queryRaw`SELECT 1`;
    return { connected: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Database connection error';
    return {
      connected: false,
      error: errorMessage,
    };
  }
}
