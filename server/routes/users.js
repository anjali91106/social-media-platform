const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth');
const { createUploadMiddleware } = require('../middlewares/upload');
const {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  getFollowStats,
  searchUsers,
  updateProfile,
  deleteProfile,
  uploadProfilePic
} = require('../controllers/userController');

// Search users
router.get('/search', authenticate, searchUsers);

// Get user follow stats
router.get('/:userId/follow-stats', authenticate, getFollowStats);

// Follow/Unfollow routes
router.post('/:userId/follow', authenticate, followUser);
router.delete('/:userId/follow', authenticate, unfollowUser);

// Get followers/following lists
router.get('/:userId/followers', authenticate, getFollowers);
router.get('/:userId/following', authenticate, getFollowing);

// Profile management routes
router.put('/profile', authenticate, updateProfile);
router.delete('/profile', authenticate, deleteProfile);

// Profile picture upload
router.post('/upload-profile-pic', 
  authenticate, 
  createUploadMiddleware('profile-pics', 'profilePic', 1, ['jpg', 'jpeg', 'png', 'gif', 'webp']), 
  uploadProfilePic
);

module.exports = router;
