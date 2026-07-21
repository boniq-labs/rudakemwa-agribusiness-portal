import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

let io: Server;

export function initSocket(httpServer: HttpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      const payload = jwt.verify(token as string, process.env.JWT_SECRET || 'secret') as any;
      (socket as any).userId = payload.id;
      (socket as any).userRole = payload.role;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = (socket as any).userId;
    socket.join(`user:${userId}`);

    socket.on('disconnect', () => {
      socket.leave(`user:${userId}`);
    });
  });

  return io;
}

export function getIO(): Server {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
}

export function emitToUser(userId: number, event: string, data: any) {
  try {
    getIO().to(`user:${userId}`).emit(event, data);
  } catch {}
}

export function emitToAll(event: string, data: any) {
  try {
    getIO().emit(event, data);
  } catch {}
}
