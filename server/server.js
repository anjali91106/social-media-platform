require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/database');
const createIndexes = require('./config/indexes');
const errorHandler = require('./middlewares/errorHandler');
const authRoutes = require('./routes/auth');
const uploadRoutes = require('./routes/upload');
const postsRoutes = require('./routes/posts');
const commentsRoutes = require('./routes/comments');
const usersRoutes = require('./routes/users');
const socketManager = require('./config/socket');

const app = express();

connectDB();
createIndexes();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, // Increased limit for development
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  }
});

app.use(helmet());
app.use(limiter);
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://social-media-platform-gules-ten.vercel.app',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    port: process.env.PORT || 5000
  });
});

// Add root endpoint for basic connectivity test
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Social Media Platform API is running',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      posts: '/api/posts',
      users: '/api/users'
    }
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/api/users', usersRoutes);

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`MongoDB URI configured: ${!!process.env.MONGODB_URI}`);
});

// Initialize Socket.io
socketManager.initialize(server);

// Handle server errors
server.on('error', (error) => {
  console.error('Server error:', error);
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
  }
});

// Handle process termination
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

process.on('unhandledRejection', (err, promise) => {
  server.close(() => {
    process.exit(1);
  });
});

module.exports = { app, server, socketManager };
