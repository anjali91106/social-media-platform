const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

class SocketManager {
  constructor() {
    this.io = null;
    this.onlineUsers = new Map(); // userId -> socketId
    this.socketUsers = new Map(); // socketId -> userId
  }

  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true
      }
    });

    // Authentication middleware for sockets
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select('username profilePic');
        
        if (!user) {
          return next(new Error('User not found'));
        }

        socket.user = user;
        socket.userId = user._id.toString();
        next();
      } catch (error) {
        next(new Error('Invalid authentication token'));
      }
    });

    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
    });

    return this.io;
  }

  handleConnection(socket) {
    const userId = socket.userId;
    const socketId = socket.id;

    console.log(`User ${socket.user.username} connected with socket ${socketId}`);

    // Add user to online users
    this.onlineUsers.set(userId, socketId);
    this.socketUsers.set(socketId, userId);

    // Join user to their personal room for targeted notifications
    socket.join(`user:${userId}`);

    // Emit online users list to all connected clients
    this.emitOnlineUsers();

    // Handle disconnect
    socket.on('disconnect', () => {
      this.handleDisconnection(socket);
    });

    // Handle join post room for real-time post updates
    socket.on('join:post', (postId) => {
      socket.join(`post:${postId}`);
    });

    // Handle leave post room
    socket.on('leave:post', (postId) => {
      socket.leave(`post:${postId}`);
    });

    // Handle typing indicators for comments
    socket.on('typing:comment', (data) => {
      socket.to(`post:${data.postId}`).emit('user:typing', {
        userId,
        username: socket.user.username,
        postId: data.postId,
        isTyping: true
      });
    });

    socket.on('stop:typing:comment', (data) => {
      socket.to(`post:${data.postId}`).emit('user:typing', {
        userId,
        username: socket.user.username,
        postId: data.postId,
        isTyping: false
      });
    });
  }

  handleDisconnection(socket) {
    const userId = socket.userId;
    const socketId = socket.id;

    console.log(`User ${socket.user.username} disconnected`);

    // Remove user from online users
    this.onlineUsers.delete(userId);
    this.socketUsers.delete(socketId);

    // Emit updated online users list
    this.emitOnlineUsers();
  }

  emitOnlineUsers() {
    const onlineUserIds = Array.from(this.onlineUsers.keys());
    this.io.emit('users:online', onlineUserIds);
  }

  // Notification methods
  emitNotification(userId, notification) {
    this.io.to(`user:${userId}`).emit('notification', notification);
  }

  emitPostUpdate(postId, event, data) {
    this.io.to(`post:${postId}`).emit(`post:${event}`, data);
  }

  emitUserUpdate(userId, event, data) {
    this.io.to(`user:${userId}`).emit(`user:${event}`, data);
  }

  // Get online users count
  getOnlineUsersCount() {
    return this.onlineUsers.size;
  }

  // Check if user is online
  isUserOnline(userId) {
    return this.onlineUsers.has(userId.toString());
  }

  // Get socket ID for user
  getUserSocketId(userId) {
    return this.onlineUsers.get(userId.toString());
  }
}

// Create singleton instance
const socketManager = new SocketManager();

module.exports = socketManager;
