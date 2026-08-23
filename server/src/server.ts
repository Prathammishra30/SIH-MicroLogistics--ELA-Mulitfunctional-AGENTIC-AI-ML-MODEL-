import { app } from './app.js';
import { config } from './config/env.js';
import { checkDatabaseConnection, prisma } from './config/prisma.js';

const PORT = config.port;

async function startServer() {
  console.log('----------------------------------------------------');
  console.log('🌱 Starting RuralFlow Micro-Logistics Backend Server');
  console.log('----------------------------------------------------');
  console.log(`📡 Environment: ${config.nodeEnv}`);
  console.log(`🌐 Configured Port: ${PORT}`);
  console.log(`🔗 Allowed Client: ${config.clientUrl}`);

  // Test database connection asynchronously on startup
  const dbStatus = await checkDatabaseConnection();
  if (dbStatus.connected) {
    console.log('✅ PostgreSQL Database: Connected successfully via Prisma');
  } else {
    console.log('⚠️  PostgreSQL Database: Not connected (Development / Offline Mode)');
    console.log(`   Detail: ${dbStatus.error}`);
  }

  const server = app.listen(PORT, () => {
    console.log(`🚀 RuralFlow API Server is listening on http://localhost:${PORT}`);
    console.log(`🩺 Health check available at: http://localhost:${PORT}/api/health`);
    console.log('----------------------------------------------------');
  });

  // Graceful Shutdown
  const shutdown = async (signal: string) => {
    console.log(`\n🛑 Received ${signal}. Closing HTTP server and Prisma client...`);
    server.close(async () => {
      await prisma.$disconnect();
      console.log('👋 Server shutdown complete.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

startServer().catch((err) => {
  console.error('💥 Fatal error during server startup:', err);
  process.exit(1);
});
