import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import { config } from './config/env.js';
import mongoose from 'mongoose';

async function bootstrap() {
  try {
    console.log('[Findora Server] Initializing database connection...');
    await connectDB();

    const app = createApp();

    const server = app.listen(config.port, () => {
      console.log(`[Findora Server] API listening on http://localhost:${config.port}`);
      console.log(`[Findora Server] Health check available at http://localhost:${config.port}/api/health`);
    });

    const shutdown = async (signal: string) => {
      console.log(`[Findora Server] Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        await mongoose.connection.close();
        console.log('[Findora Server] MongoDB connection closed. Process exited.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (error) {
    console.error('[Findora Server] Fatal startup error:', error);
    process.exit(1);
  }
}

bootstrap();

