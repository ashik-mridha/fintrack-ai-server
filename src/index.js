
import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import { connectDB } from './config/db.js';

import authRoutes from './routes/authRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import budgetRoutes from './routes/budgetRoutes.js';

import {
  notFound,
  errorHandler,
} from './middleware/errorHandler.js';

const app = express();

// port import .env


const PORT = process.env.PORT || 5000;
const CLIENT_URL =
  process.env.CLIENT_URL || 'http://localhost:5173';

if (!process.env.MONGO_URI) {
  console.error('❌ MONGO_URI is missing in .env');
  process.exit(1);
}
if (!process.env.JWT_SECRET) {
  console.error('❌ JWT_SECRET is missing in .env');
  process.exit(1);
}

// Middleware
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'FinTrack AI server is running',
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/budgets', budgetRoutes);

// Handle unknown routes
app.use(notFound);

// Global error handler (must be last)
app.use(errorHandler);

// Connect database and start server
const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log('-----------------------------------');
      console.log('🚀 FinTrack AI server started');
      console.log(`🌐 Server: http://localhost:${PORT}`);
      console.log(`🔗 Health: http://localhost:${PORT}/api/health`);
      console.log(`🔐 Auth: http://localhost:${PORT}/api/auth`);
      console.log(`🖥️ Client: ${CLIENT_URL}`);
      console.log('-----------------------------------');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
