import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  databaseUrl: process.env.DATABASE_URL || '',
  jwtSecret: process.env.JWT_SECRET || 'ruralflow-dev-secret-key-phase4b-jwt-2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV !== 'production',
} as const;
