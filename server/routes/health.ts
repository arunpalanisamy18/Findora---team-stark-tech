import { Router, Request, Response } from 'express';
import { getDatabaseStatus } from '../config/db.js';

export const healthRouter = Router();

healthRouter.get('/', (req: Request, res: Response) => {
  const dbStatus = getDatabaseStatus();

  const responsePayload = {
    success: true,
    status: dbStatus.connected ? 'healthy' : 'degraded',
    service: 'Findora Backend API',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    database: {
      provider: 'MongoDB',
      connected: dbStatus.connected,
      state: dbStatus.state,
      name: dbStatus.name,
      host: dbStatus.host,
    },
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
  };

  const statusCode = dbStatus.connected ? 200 : 503;
  res.status(statusCode).json(responsePayload);
});

