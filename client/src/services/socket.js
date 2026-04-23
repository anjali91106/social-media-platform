import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
  }

  // Initialize socket connection
  connect(token) {
    if (this.socket && this.connected) {
      return this.socket;
    }

    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    
    this.socket = io(socketUrl, {
      auth: {
        token,
      },
      transports: ['websocket'],
    });

    this.setupEventListeners();
    return this.socket;
  }

  // Setup event listeners
  setupEventListeners() {
    this.socket.on('connect', () => {
      this.connected = true;
    });

    this.socket.on('disconnect', () => {
      this.connected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.connected = false;
    });
  }

  // Disconnect socket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  // Join post room for real-time updates
  joinPost(postId) {
    if (this.socket && this.connected) {
      this.socket.emit('join:post', postId);
    }
  }

  // Leave post room
  leavePost(postId) {
    if (this.socket && this.connected) {
      this.socket.emit('leave:post', postId);
    }
  }

  // Send typing indicator
  startTyping(postId) {
    if (this.socket && this.connected) {
      this.socket.emit('typing:comment', { postId });
    }
  }

  stopTyping(postId) {
    if (this.socket && this.connected) {
      this.socket.emit('stop:typing:comment', { postId });
    }
  }

  // Listen for notifications
  onNotification(callback) {
    if (this.socket) {
      this.socket.on('notification', callback);
    }
  }

  // Listen for post updates
  onPostLiked(callback) {
    if (this.socket) {
      this.socket.on('post:liked', callback);
    }
  }

  onPostUnliked(callback) {
    if (this.socket) {
      this.socket.on('post:unliked', callback);
    }
  }

  onCommentAdded(callback) {
    if (this.socket) {
      this.socket.on('post:comment_added', callback);
    }
  }

  // Listen for user updates
  onUserFollowed(callback) {
    if (this.socket) {
      this.socket.on('user:followed', callback);
    }
  }

  onUserUnfollowed(callback) {
    if (this.socket) {
      this.socket.on('user:unfollowed', callback);
    }
  }

  // Listen for online users
  onOnlineUsers(callback) {
    if (this.socket) {
      this.socket.on('users:online', callback);
    }
  }

  // Listen for typing indicators
  onUserTyping(callback) {
    if (this.socket) {
      this.socket.on('user:typing', callback);
    }
  }

  // Remove event listeners
  offNotification(callback) {
    if (this.socket) {
      this.socket.off('notification', callback);
    }
  }

  offPostLiked(callback) {
    if (this.socket) {
      this.socket.off('post:liked', callback);
    }
  }

  offPostUnliked(callback) {
    if (this.socket) {
      this.socket.off('post:unliked', callback);
    }
  }

  offCommentAdded(callback) {
    if (this.socket) {
      this.socket.off('post:comment_added', callback);
    }
  }

  offUserFollowed(callback) {
    if (this.socket) {
      this.socket.off('user:followed', callback);
    }
  }

  offUserUnfollowed(callback) {
    if (this.socket) {
      this.socket.off('user:unfollowed', callback);
    }
  }

  offOnlineUsers(callback) {
    if (this.socket) {
      this.socket.off('users:online', callback);
    }
  }

  offUserTyping(callback) {
    if (this.socket) {
      this.socket.off('user:typing', callback);
    }
  }

  // Check if connected
  isConnected() {
    return this.connected;
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;
