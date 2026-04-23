const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');

const createIndexes = async () => {
  try {
    console.log('Creating database indexes...');

    // User indexes
    await User.createIndexes([
      { username: 1 }, // Unique index already exists
      { email: 1 }, // Unique index already exists
      { followers: 1 },
      { following: 1 },
      { createdAt: -1 }
    ]);

    // Post indexes
    await Post.createIndexes([
      { userId: 1, createdAt: -1 }, // For user's posts
      { createdAt: -1 }, // For general feed
      { tags: 1 }, // For tag-based queries
      { likes: 1 }, // For popular posts
      { location: 1 }, // For location-based queries
      { "media.type": 1 }, // For media type queries
      { userId: 1, "media.type": 1 } // For user's media posts
    ]);

    // Comment indexes
    await Comment.createIndexes([
      { postId: 1, createdAt: -1 }, // For post comments
      { userId: 1, createdAt: -1 }, // For user's comments
      { parentCommentId: 1, createdAt: 1 }, // For replies
      { postId: 1, parentCommentId: 1, createdAt: -1 }, // For nested comments
      { likes: 1 }, // For popular comments
      { isDeleted: 1 }, // For filtering deleted comments
      { postId: 1, isDeleted: 1, createdAt: -1 }, // For active comments
      { postId: 1, parentCommentId: 1 }, // For finding comments by post and parent
      { parentCommentId: 1 } // For finding all replies to a comment
    ]);

    console.log('Database indexes created successfully');
  } catch (error) {
    console.error('Error creating database indexes:', error);
  }
};

module.exports = createIndexes;
