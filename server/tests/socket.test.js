/**
 * Socket.io Tests
 * Comprehensive test suite for real-time functionality
 */

const { Server } = require('socket.io');
const Client = require('socket.io-client');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../server');
const User = require('../models/User');
const Post = require('../models/Post');
const socketManager = require('../config/socket');

describe('Socket.io Real-time Features', () => {
  let io, serverSocket, clientSocket, clientSocket2;
  let testUser, testUser2;
  let accessToken, accessToken2;
  let httpServer;

  beforeAll(async () => {
    // Connect to test database
    const mongoUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/social-media-test';
    await mongoose.connect(mongoUri);

    // Create HTTP server for socket.io
    httpServer = require('http').createServer(app);
    io = socketManager.initialize(httpServer);
    
    // Start server
    await new Promise((resolve) => {
      httpServer.listen(() => resolve());
    });

    // Create test users
    testUser = await new User({
      username: 'testuser',
      email: 'test@example.com',
      password: 'Test123!@#'
    }).save();

    testUser2 = await new User({
      username: 'testuser2',
      email: 'test2@example.com',
      password: 'Test123!@#'
    }).save();

    // Generate tokens
    accessToken = jwt.sign({ userId: testUser._id }, process.env.JWT_SECRET || 'test-secret');
    accessToken2 = jwt.sign({ userId: testUser2._id }, process.env.JWT_SECRET || 'test-secret');
  });

  afterAll(async () => {
    // Clean up
    io.close();
    httpServer.close();
    await User.deleteMany({});
    await Post.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach((done) => {
    // Setup client sockets
    clientSocket = Client(`http://localhost:${httpServer.address().port}`, {
      auth: { token: accessToken }
    });

    clientSocket2 = Client(`http://localhost:${httpServer.address().port}`, {
      auth: { token: accessToken2 }
    });

    clientSocket.on('connect', () => {
      clientSocket2.on('connect', () => {
        done();
      });
    });
  });

  afterEach(() => {
    // Cleanup client sockets
    if (clientSocket) clientSocket.close();
    if (clientSocket2) clientSocket2.close();
  });

  describe('Socket Authentication', () => {
    it('should authenticate user successfully', (done) => {
      clientSocket.on('connect', () => {
        expect(clientSocket.connected).toBe(true);
        done();
      });
    });

    it('should reject connection with invalid token', (done) => {
      const invalidSocket = Client(`http://localhost:${httpServer.address().port}`, {
        auth: { token: 'invalid-token' }
      });

      invalidSocket.on('connect_error', (error) => {
        expect(error.message).toContain('Invalid authentication token');
        invalidSocket.close();
        done();
      });
    });

    it('should reject connection without token', (done) => {
      const noTokenSocket = Client(`http://localhost:${httpServer.address().port}`);

      noTokenSocket.on('connect_error', (error) => {
        expect(error.message).toContain('Authentication token required');
        noTokenSocket.close();
        done();
      });
    });
  });

  describe('Online Users Tracking', () => {
    it('should track online users', (done) => {
      clientSocket.on('users:online', (onlineUsers) => {
        expect(Array.isArray(onlineUsers)).toBe(true);
        expect(onlineUsers.length).toBeGreaterThanOrEqual(1);
        expect(onlineUsers).toContain(testUser._id.toString());
        done();
      });
    });

    it('should update online users when user disconnects', (done) => {
      let onlineUsersReceived = false;

      clientSocket2.on('users:online', (onlineUsers) => {
        if (onlineUsersReceived) {
          expect(onlineUsers).not.toContain(testUser._id.toString());
          done();
        }
        onlineUsersReceived = true;
      });

      // Disconnect first user
      setTimeout(() => {
        clientSocket.close();
      }, 100);
    });
  });

  describe('Post Room Management', () => {
    let testPost;

    beforeEach(async () => {
      testPost = await new Post({
        caption: 'Test post for socket',
        userId: testUser._id
      }).save();
    });

    it('should join post room successfully', (done) => {
      clientSocket.emit('join:post', testPost._id.toString());
      
      // Verify by checking if socket receives post updates
      setTimeout(() => {
        // Emit a post update to test room membership
        io.to(`post:${testPost._id}`).emit('post:test', { message: 'test' });
        
        clientSocket.on('post:test', (data) => {
          expect(data.message).toBe('test');
          done();
        });
      }, 100);
    });

    it('should leave post room successfully', (done) => {
      clientSocket.emit('join:post', testPost._id.toString());
      
      setTimeout(() => {
        clientSocket.emit('leave:post', testPost._id.toString());
        
        // Emit update after leaving room
        setTimeout(() => {
          io.to(`post:${testPost._id}`).emit('post:test', { message: 'test' });
          
          // Should not receive the message after leaving
          let messageReceived = false;
          
          setTimeout(() => {
            expect(messageReceived).toBe(false);
            done();
          }, 100);
          
          clientSocket.on('post:test', () => {
            messageReceived = true;
          });
        }, 100);
      }, 100);
    });
  });

  describe('Typing Indicators', () => {
    let testPost;

    beforeEach(async () => {
      testPost = await new Post({
        caption: 'Test post for typing',
        userId: testUser._id
      }).save();

      // Both users join the post room
      clientSocket.emit('join:post', testPost._id.toString());
      clientSocket2.emit('join:post', testPost._id.toString());
    });

    it('should emit typing indicator when user starts typing', (done) => {
      clientSocket2.on('user:typing', (data) => {
        expect(data.userId).toBe(testUser._id.toString());
        expect(data.username).toBe('testuser');
        expect(data.postId).toBe(testPost._id.toString());
        expect(data.isTyping).toBe(true);
        done();
      });

      clientSocket.emit('typing:comment', { postId: testPost._id.toString() });
    });

    it('should emit typing indicator when user stops typing', (done) => {
      clientSocket2.on('user:typing', (data) => {
        if (data.isTyping === false) {
          expect(data.userId).toBe(testUser._id.toString());
          expect(data.username).toBe('testuser');
          expect(data.postId).toBe(testPost._id.toString());
          expect(data.isTyping).toBe(false);
          done();
        }
      });

      clientSocket.emit('typing:comment', { postId: testPost._id.toString() });
      setTimeout(() => {
        clientSocket.emit('stop:typing:comment', { postId: testPost._id.toString() });
      }, 50);
    });

    it('should not send typing indicators to users not in post room', (done) => {
      // User 2 leaves the post room
      clientSocket2.emit('leave:post', testPost._id.toString());
      
      setTimeout(() => {
        let typingReceived = false;
        
        clientSocket2.on('user:typing', () => {
          typingReceived = true;
        });
        
        clientSocket.emit('typing:comment', { postId: testPost._id.toString() });
        
        setTimeout(() => {
          expect(typingReceived).toBe(false);
          done();
        }, 100);
      }, 100);
    });
  });

  describe('Real-time Notifications', () => {
    it('should send notification to specific user', (done) => {
      const notificationData = {
        type: 'new_like',
        data: {
          postId: new mongoose.Types.ObjectId(),
          likerUsername: 'testuser2'
        }
      };

      clientSocket.on('notification', (notification) => {
        expect(notification.type).toBe('new_like');
        expect(notification.data.likerUsername).toBe('testuser2');
        done();
      });

      // Send notification to test user
      socketManager.emitNotification(testUser._id.toString(), {
        id: '1',
        type: 'new_like',
        timestamp: new Date().toISOString(),
        read: false,
        title: 'New Like',
        message: 'testuser2 liked your post',
        data: notificationData.data
      });
    });

    it('should not send notification to offline user', (done) => {
      // Disconnect user
      clientSocket.close();
      
      setTimeout(() => {
        // Try to send notification to offline user
        const isOnline = socketManager.isUserOnline(testUser._id.toString());
        expect(isOnline).toBe(false);
        done();
      }, 100);
    });
  });

  describe('Post Updates', () => {
    let testPost;

    beforeEach(async () => {
      testPost = await new Post({
        caption: 'Test post for updates',
        userId: testUser._id
      }).save();

      // Both users join the post room
      clientSocket.emit('join:post', testPost._id.toString());
      clientSocket2.emit('join:post', testPost._id.toString());
    });

    it('should broadcast post like updates', (done) => {
      const likeData = {
        postId: testPost._id.toString(),
        likeCount: 1,
        userId: testUser2._id.toString()
      };

      clientSocket.on('post:liked', (data) => {
        expect(data.postId).toBe(testPost._id.toString());
        expect(data.likeCount).toBe(1);
        done();
      });

      socketManager.emitPostUpdate(testPost._id.toString(), 'liked', likeData);
    });

    it('should broadcast post unlike updates', (done) => {
      const unlikeData = {
        postId: testPost._id.toString(),
        likeCount: 0,
        userId: testUser2._id.toString()
      };

      clientSocket.on('post:unliked', (data) => {
        expect(data.postId).toBe(testPost._id.toString());
        expect(data.likeCount).toBe(0);
        done();
      });

      socketManager.emitPostUpdate(testPost._id.toString(), 'unliked', unlikeData);
    });

    it('should broadcast comment updates', (done) => {
      const commentData = {
        postId: testPost._id.toString(),
        commentId: new mongoose.Types.ObjectId(),
        commentCount: 1,
        userId: testUser2._id.toString()
      };

      clientSocket.on('post:comment_added', (data) => {
        expect(data.postId).toBe(testPost._id.toString());
        expect(data.commentCount).toBe(1);
        done();
      });

      socketManager.emitPostUpdate(testPost._id.toString(), 'comment_added', commentData);
    });
  });

  describe('User Updates', () => {
    it('should send follow updates to specific user', (done) => {
      const followData = {
        followerId: testUser2._id.toString(),
        followerUsername: 'testuser2',
        followerProfilePic: 'https://example.com/pic.jpg'
      };

      clientSocket.on('user:followed', (data) => {
        expect(data.followerId).toBe(testUser2._id.toString());
        expect(data.followerUsername).toBe('testuser2');
        done();
      });

      socketManager.emitUserUpdate(testUser._id.toString(), 'followed', followData);
    });

    it('should send unfollow updates to specific user', (done) => {
      const unfollowData = {
        followerId: testUser2._id.toString(),
        followerUsername: 'testuser2'
      };

      clientSocket.on('user:unfollowed', (data) => {
        expect(data.followerId).toBe(testUser2._id.toString());
        expect(data.followerUsername).toBe('testuser2');
        done();
      });

      socketManager.emitUserUpdate(testUser._id.toString(), 'unfollowed', unfollowData);
    });
  });

  describe('Socket Manager Utilities', () => {
    it('should correctly report online users count', () => {
      const count = socketManager.getOnlineUsersCount();
      expect(count).toBeGreaterThanOrEqual(1);
    });

    it('should correctly check if user is online', () => {
      const isOnline = socketManager.isUserOnline(testUser._id.toString());
      expect(isOnline).toBe(true);
    });

    it('should return socket ID for online user', () => {
      const socketId = socketManager.getUserSocketId(testUser._id.toString());
      expect(socketId).toBeDefined();
      expect(typeof socketId).toBe('string');
    });

    it('should return null for offline user socket ID', () => {
      const offlineUserId = new mongoose.Types.ObjectId().toString();
      const socketId = socketManager.getUserSocketId(offlineUserId);
      expect(socketId).toBeUndefined();
    });
  });
});
