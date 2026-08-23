import type { Request, Response } from 'express';
import { sendSuccess } from '../../utils/response.js';
import { checkDatabaseConnection } from '../../config/prisma.js';
import { config } from '../../config/env.js';

export async function getHealth(_req: Request, res: Response): Promise<void> {
  const dbStatus = await checkDatabaseConnection();

  sendSuccess(res, 'RuralFlow API is running', {
    status: 'healthy',
    version: '1.0.0',
    environment: config.nodeEnv,
    database: {
      connected: dbStatus.connected,
      ...(dbStatus.error && { message: dbStatus.error }),
    },
    uptime: process.uptime(),
  });
}
