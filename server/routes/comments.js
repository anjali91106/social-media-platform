const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth');
const {
  addComment,
  replyToComment,
  deleteComment,
  getComments,
  likeComment,
  unlikeComment,
  getCommentReplies
} = require('../controllers/commentsController');

// Add comment to post
router.post('/posts/:postId', authenticate, addComment);

// Get all comments for a post (with nested structure)
router.get('/posts/:postId', getComments);

// Reply to a specific comment
router.post('/posts/:postId/comments/:commentId/reply', authenticate, replyToComment);

// Like/unlike comment
router.post('/comments/:commentId/like', authenticate, likeComment);
router.delete('/comments/:commentId/like', authenticate, unlikeComment);

// Get replies to a specific comment
router.get('/comments/:commentId/replies', getCommentReplies);

// Delete comment
router.delete('/comments/:commentId', authenticate, deleteComment);

module.exports = router;
