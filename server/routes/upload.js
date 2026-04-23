const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth');
const { createUploadMiddleware, createMultipleUploadMiddleware } = require('../middlewares/upload');
const {
  uploadProfileImage,
  uploadPostImages,
  deletePost,
  getPost
} = require('../controllers/uploadController');

// Profile image upload
router.post('/profile', 
  authenticate, 
  createUploadMiddleware('profile-images', 'profilePic'), 
  uploadProfileImage
);

// Post images upload (multiple images)
router.post('/post/images', 
  authenticate, 
  createMultipleUploadMiddleware('post-images', 'images', 5), 
  uploadPostImages
);


// Get post by ID
router.get('/post/:postId', getPost);

// Delete post (and associated files)
router.delete('/post/:postId', authenticate, deletePost);

module.exports = router;
