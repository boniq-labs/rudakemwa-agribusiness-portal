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
import logger from './utils/logger';

dotenv.config();

const app = express();
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
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { success: false, message: 'Too many attempts, try again later' }, standardHeaders: true, legacyHeaders: false });
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

httpServer.listen(PORT, () => {
  logger.info(`EFMS API running on port ${PORT} (${isDev ? 'development' : 'production'} mode)`);
  console.log(`EFMS API: http://localhost:${PORT}/api/health`);
});

export { app, httpServer, io };
