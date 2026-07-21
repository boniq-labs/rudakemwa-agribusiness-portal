import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
let io;
export function initSocket(httpServer) {
    io = new Server(httpServer, {
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:5173',
            credentials: true,
        },
    });
    io.use((socket, next) => {
        const token = socket.handshake.auth.token || socket.handshake.query.token;
        if (!token)
            return next(new Error('Authentication required'));
        try {
            const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret');
            socket.userId = payload.id;
            socket.userRole = payload.role;
            next();
        }
        catch {
            next(new Error('Invalid token'));
        }
    });
    io.on('connection', (socket) => {
        const userId = socket.userId;
        socket.join(`user:${userId}`);
        socket.on('disconnect', () => {
            socket.leave(`user:${userId}`);
        });
    });
    return io;
}
export function getIO() {
    if (!io)
        throw new Error('Socket.io not initialized');
    return io;
}
export function emitToUser(userId, event, data) {
    try {
        getIO().to(`user:${userId}`).emit(event, data);
    }
    catch { }
}
export function emitToAll(event, data) {
    try {
        getIO().emit(event, data);
    }
    catch { }
}
//# sourceMappingURL=socketService.js.map