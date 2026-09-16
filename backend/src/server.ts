import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import app from './app';
import { ENV } from './config/env';
import prisma from './repositories/prisma';

const server = http.createServer(app);

// Real-time WebSockets
export const io = new SocketIOServer(server, {
  cors: {
    origin: [ENV.FRONTEND_URL, ENV.ADMIN_URL, 'http://localhost:5173'],
    credentials: true,
  },
});

io.on('connection', (socket) => {
  if (ENV.NODE_ENV === 'development') {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);
  }
  socket.on('disconnect', () => {
    if (ENV.NODE_ENV === 'development') {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    }
  });
});

async function bootstrap() {
  server.listen(ENV.PORT, () => {
    console.log(`========================================`);
    console.log(`?? NOBELLE Backend API running on port ${ENV.PORT}`);
    console.log(`?? Health check: http://localhost:${ENV.PORT}/api/health`);
    console.log(`?? Environment: ${ENV.NODE_ENV}`);
    console.log(`========================================`);
  });
}

// Graceful shutdown
const shutdown = async () => {
  console.log('Shutting down server gracefully...');
  await prisma.$disconnect();
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

bootstrap();
