const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth');
const {  
  createMultipleUploadMiddleware
} = require('../middlewares/upload');
const {
  createPost,
  updatePost,
  deletePost,
  likePost,
  unlikePost,
  getFeed,
  getAllPosts,
  getPostById,
  getUserPosts,
  searchPosts
} = require('../controllers/postsController');

// Create post with media upload
router.post('/', 
  authenticate, 
  createMultipleUploadMiddleware('post-media', 'media', 10, ['jpg', 'jpeg', 'png', 'gif', 'webp']), 
  createPost
);

// Update post
router.put('/:postId', authenticate, updatePost);

// Delete post
router.delete('/:postId', authenticate, deletePost);

// Like/unlike post
router.post('/:postId/like', authenticate, likePost);
router.delete('/:postId/like', authenticate, unlikePost);

// Get feed (posts from followed users)
router.get('/feed', authenticate, getFeed);

// Get all posts (public)
router.get('/', getAllPosts);

// Search posts
router.get('/search', authenticate, searchPosts);

// Get posts by user
router.get('/user/:userId', authenticate, getUserPosts);

// Get post by ID
router.get('/:postId', getPostById);

module.exports = router;
