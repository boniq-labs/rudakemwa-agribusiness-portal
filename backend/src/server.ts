import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import routes from './routes/index';
import { errorHandler, notFound } from './middlewares/errorHandler';
import { initSocket } from './services/socketService';
import { initCronJobs } from './services/cronService';
import { migrate } from './config/migrate';
import { runMigrations } from './database/index';
import pool from './config/database';
import logger from './utils/logger';

dotenv.config();

const app = express();
app.set('trust proxy', 1);
const httpServer = createServer(app);
const PORT = process.env.PORT || 5000;
const isDev = process.env.NODE_ENV !== 'production';

// Security
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: [process.env.FRONTEND_URL || 'http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 50, message: { success: false, message: 'Too many attempts, try again later' }, standardHeaders: true, legacyHeaders: false, skipSuccessfulRequests: true });
const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false });

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/api/auth/login', authLimiter);
app.use('/api', apiLimiter);

// Static files for uploads
app.use('/uploads', express.static('uploads'));

// API routes
app.use('/api', routes);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Initialize services
const io = initSocket(httpServer);
initCronJobs();

io.on('connection', (socket) => {
  logger.info(`Socket connected: ${socket.id}`);
});

httpServer.on('error', (err: NodeJS.ErrnoException) => {
  logger.error({ message: `Server failed to start: ${err.message}`, port: PORT, code: err.code });
  if (err.code === 'EADDRINUSE') console.error(`Port ${PORT} is already in use. Kill the process using port ${PORT} and try again.`);
  process.exit(1);
});

(async () => {
  if (process.env.RUN_MIGRATIONS === 'true') {
    try {
      const conn = await pool.getConnection();
      await runMigrations(conn);
      conn.release();
      logger.info('Migrations completed');
    } catch (err: any) {
      logger.error({ message: 'Migration failed', error: err.message });
      process.exit(1);
    }
  } else {
    logger.info('Migrations skipped (RUN_MIGRATIONS != true)');
  }
  httpServer.listen(PORT, () => {
    logger.info(`EFMS API running on port ${PORT} (${isDev ? 'development' : 'production'} mode)`);
    console.log(`EFMS API: http://localhost:${PORT}/api/health`);
  });
})();

export { app, httpServer, io };
