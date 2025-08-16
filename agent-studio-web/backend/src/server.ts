import express from 'express';
import cors from 'cors';
import fs from 'fs-extra';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import projectRoutes from './routes/projects';
import agentRoutes from './routes/agents';
import storyRoutes from './routes/stories';
import codebaseRoutes from './routes/codebase';
import aiRoutes from './routes/ai';
import terminalRoutes from './routes/terminal';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';

// Load environment variables
dotenv.config();

// Initialize Prisma client
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['warn', 'error'],
});

const app = express();
const httpServer = createServer(app);

// WebSocket server for real-time updates
const wss = new WebSocketServer({ server: httpServer });

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/projects', authMiddleware, projectRoutes);
app.use('/api/agents', authMiddleware, agentRoutes);
app.use('/api/stories', authMiddleware, storyRoutes);
app.use('/api/codebase', authMiddleware, codebaseRoutes);
app.use('/api/ai', authMiddleware, aiRoutes);
app.use('/api/terminal', authMiddleware, terminalRoutes);

// WebSocket connections for real-time updates
wss.on('connection', (ws, req) => {
  console.log('New WebSocket connection established');

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log('Received WebSocket message:', message);
      
      // Handle different message types
      switch (message.type) {
        case 'subscribe':
          // Subscribe to specific channels (projects, agents, etc.)
          ws.send(JSON.stringify({
            type: 'subscribed',
            channel: message.channel
          }));
          break;
        default:
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Unknown message type'
          }));
      }
    } catch (error) {
      console.error('WebSocket message parsing error:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid message format'
      }));
    }
  });

  ws.on('close', () => {
    console.log('WebSocket connection closed');
  });

  // Send welcome message
  ws.send(JSON.stringify({
    type: 'welcome',
    message: 'Connected to BMAD-METHOD WebSocket server'
  }));
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
  });
});

const PORT = process.env.PORT || 5000;

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down server...');
  await prisma.$disconnect();
  httpServer.close(() => {
    console.log('Server shut down successfully');
    process.exit(0);
  });
});

// Start server
httpServer.listen(PORT, () => {
  // Ensure runtime directories exist
  fs.ensureDirSync('uploads');
  fs.ensureDirSync('outputs');

  console.log(`🚀 BMAD-METHOD Backend Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔌 WebSocket server ready for connections`);
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`📱 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  }
});

export { wss };
export default app;