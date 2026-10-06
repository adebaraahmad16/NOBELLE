import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import app from './app';
import { ENV } from './config/env';
import prisma from './repositories/prisma';
import { validateEnvironment } from './config/validateEnv';
import { runJobs } from './jobs/worker';

const server = http.createServer(app);

// Real-time WebSockets
export const io = new SocketIOServer(server, {
  cors: {
    origin: [
      ENV.FRONTEND_URL,
      ENV.ADMIN_URL,
    ],
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

let workerTimer: NodeJS.Timeout | undefined;
async function bootstrap() {
  validateEnvironment();
  await prisma.$connect();
  workerTimer = setInterval(() => runJobs().catch(() => console.error('Background worker failed')), 30000);
  workerTimer.unref();
  server.listen(ENV.PORT, () => {
    console.log(`========================================`);
    console.log(`?? NOBELLE Backend API running on port ${ENV.PORT}`);
    console.log(`?? Health check: http://localhost:${ENV.PORT}/api/health`);
    console.log(`?? Environment: ${ENV.NODE_ENV}`);
    console.log(`========================================`);
  });
}

let stopping = false;
const shutdown = async () => {
  if (stopping) return;
  stopping = true;
  if (workerTimer) clearInterval(workerTimer);
  const deadline = setTimeout(() => { server.closeAllConnections(); process.exit(1); }, 15000);
  deadline.unref();
  io.disconnectSockets(true);
  await new Promise<void>(resolve => server.close(() => resolve()));
  io.close();
  await prisma.$disconnect();
  clearTimeout(deadline);
  process.exit(0);
};
process.on('SIGINT', () => shutdown().catch(() => process.exit(1)));
process.on('SIGTERM', () => shutdown().catch(() => process.exit(1)));

bootstrap().catch((err) => { console.error('Startup failed:', err?.message ?? err); process.exitCode = 1; });
