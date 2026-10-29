import express, { Express, Request, Response, NextFunction } from 'express';
import path from 'node:path';
import cors from 'cors';
import { config } from './config/env.js';
import { healthRouter } from './routes/health.js';
import { itemsRouter } from './routes/items.js';
import { claimsRouter } from './routes/claims.js';
import { adminRouter } from './routes/admin.js';
import { authRouter } from './routes/auth.js';
import { locationsRouter } from './routes/locations.js';
import { errorHandler, AppError } from './middleware/errorHandler.js';

export function createApp(): Express {
  const app = express();

  const localOriginRegex = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

  app.disable('x-powered-by');
  app.set('trust proxy', process.env.TRUST_PROXY === 'true' ? 1 : false);
  app.use((req, res, next) => { res.setHeader('X-Content-Type-Options','nosniff'); res.setHeader('X-Frame-Options','DENY'); res.setHeader('Referrer-Policy','strict-origin-when-cross-origin'); res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=()'); next(); });
  app.use((req, res, next) => { const key = `${req.ip}:${req.path.startsWith('/api/auth') ? 'auth' : 'api'}`; const store = (globalThis as any).__findoraRateLimits || ((globalThis as any).__findoraRateLimits = new Map()); const now=Date.now(); const entry=store.get(key) || {start:now,count:0}; if(now-entry.start>60000){entry.start=now;entry.count=0;} entry.count++; store.set(key,entry); if(entry.count>(req.path.startsWith('/api/auth')?20:300)){res.status(429).json({success:false,error:'Too many requests. Please try again shortly.'});return;} next(); });

  app.use(
    cors({
      origin: (requestOrigin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
        if (!requestOrigin) {
          return callback(null, true);
        }
        // Allow any local development origin or configured clientOrigin
        if ((config.nodeEnv !== 'production' && localOriginRegex.test(requestOrigin)) || requestOrigin === config.clientOrigin) {
          return callback(null, true);
        }
        return callback(new Error('Origin not allowed by CORS')); 
      },
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
    })
  );

  // Body parsers
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));

  // Basic request logger in development
  if (config.nodeEnv !== 'test') {
    app.use((req: Request, _res: Response, next: NextFunction) => {
      console.log(`[HTTP] ${req.method} ${req.url} (Origin: ${req.headers.origin || 'none'})`);
      next();
    });
  }

  // API Routes - mounted at both /api/* and root level /* for maximum resilience
  app.use(['/api/health', '/health'], healthRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/locations', locationsRouter);
  app.use(['/api/items', '/items'], itemsRouter);
  app.use(['/api/claims', '/claims'], claimsRouter);
  app.use(['/api/admin', '/admin'], adminRouter);

  // Serve the existing Vite production build when deployed as a single container.
  const frontendDir = path.resolve(process.cwd(), 'dist');
  app.use(express.static(frontendDir, { index: false, maxAge: config.nodeEnv === 'production' ? '1h' : 0 }));
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.method === 'GET' && !req.path.startsWith('/api/') && req.accepts('html')) {
      res.sendFile(path.join(frontendDir, 'index.html'), (err) => { if (err) next(err); });
      return;
    }
    next();
  });

  // Catch-all 404 for unknown API endpoints
  app.use((req: Request, _res: Response, next: NextFunction) => {
    next(new AppError(`Endpoint not found: ${req.method} ${req.originalUrl}`, 404));
  });

  // Central error handler
  app.use(errorHandler);

  return app;
}
