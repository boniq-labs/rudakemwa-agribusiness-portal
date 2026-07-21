import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
export declare function initSocket(httpServer: HttpServer): Server<import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, any>;
export declare function getIO(): Server;
export declare function emitToUser(userId: number, event: string, data: any): void;
export declare function emitToAll(event: string, data: any): void;
//# sourceMappingURL=socketService.d.ts.map