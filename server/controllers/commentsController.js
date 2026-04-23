const Comment = require('../models/Comment');
const Post = require('../models/Post');
const { sendNotification, sendPostUpdate } = require('../utils/notifications');

const addComment = async (req, res, next) => {
  try {
    
    const { postId } = req.params;
    const { text, parentCommentId } = req.body;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    if (parentCommentId) {
      const parentComment = await Comment.findById(parentCommentId);
      if (!parentComment || parentComment.postId.toString() !== postId) {
        return res.status(404).json({
          success: false,
          message: 'Parent comment not found'
        });
      }
    }

    const comment = new Comment({
      postId,
      userId: req.user._id,
      text,
      parentCommentId: parentCommentId || null
    });

    try {
      const savedComment = await comment.save();
      
      await comment.populate('userId', 'username profilePic');
    } catch (saveError) {
      throw saveError;
    }

    // Send notification to post author if it's not the same user and not a reply
    if (post.userId.toString() !== req.user._id.toString() && !parentCommentId) {
      sendNotification(post.userId.toString(), 'new_comment', {
        postId: post._id,
        commentId: comment._id,
        commenterId: req.user._id,
        commenterUsername: req.user.username,
        commenterProfilePic: req.user.profilePic,
        commentText: text,
        contentType: post.media.length > 0 ? 'post' : 'post'
      });
    }

    // Send notification to parent comment author if it's a reply and not the same user
    if (parentCommentId) {
      const parentComment = await Comment.findById(parentCommentId).populate('userId', 'username profilePic');
      if (parentComment && parentComment.userId._id.toString() !== req.user._id.toString()) {
        sendNotification(parentComment.userId._id.toString(), 'comment_reply', {
          postId: post._id,
          commentId: parentCommentId,
          replyId: comment._id,
          replierId: req.user._id,
          replierUsername: req.user.username,
          replierProfilePic: req.user.profilePic,
          replyText: text
        });
      }
    }

    // Emit real-time update to post room
    sendPostUpdate(postId, 'comment_added', {
      postId,
      comment: comment.toObject()
    });

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: comment
    });
  } catch (error) {
    next(error);
  }
};

const replyToComment = async (req, res, next) => {
  try {
    const { postId, commentId } = req.params;
    const { text } = req.body;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const parentComment = await Comment.findById(commentId);
    if (!parentComment || parentComment.postId.toString() !== postId) {
      return res.status(404).json({
        success: false,
        message: 'Parent comment not found'
      });
    }

    const reply = new Comment({
      postId,
      userId: req.user._id,
      text,
      parentCommentId: commentId
    });

    await reply.save();
    await reply.populate('userId', 'username profilePic');

    res.status(201).json({
      success: true,
      message: 'Reply added successfully',
      data: reply
    });
  } catch (error) {
    next(error);
  }
};

const deleteComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    if (comment.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this comment'
      });
    }

    // Soft delete the comment
    await comment.softDelete();

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

const getComments = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Get top-level comments (no parent)
    const topLevelComments = await Comment.find({ 
      postId, 
      parentCommentId: null,
      isDeleted: false 
    })
      .populate('userId', 'username profilePic')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalComments = await Comment.countDocuments({ 
      postId, 
      parentCommentId: null,
      isDeleted: false 
    });

    // For each top-level comment, get its replies
    const commentsWithReplies = await Promise.all(
      topLevelComments.map(async (comment) => {
        const commentObj = comment.toObject();

        // Get replies for this comment (2 levels deep for performance)
        const replies = await Comment.find({ 
          parentCommentId: comment._id,
          isDeleted: false 
        })
          .populate('userId', 'username profilePic')
          .sort({ createdAt: 1 })
          .limit(10); // Limit replies for performance

        // Get nested replies (replies to replies)
        const repliesWithNested = await Promise.all(
          replies.map(async (reply) => {
            const replyObj = reply.toObject();

            const nestedReplies = await Comment.find({
              parentCommentId: reply._id,
              isDeleted: false
            })
              .populate('userId', 'username profilePic')
              .sort({ createdAt: 1 })
              .limit(5); // Limit nested replies

            replyObj.replies = nestedReplies;
            return replyObj;
          })
        );

        commentObj.replies = repliesWithNested;
        return commentObj;
      })
    );

    res.status(200).json({
      success: true,
      data: {
        comments: commentsWithReplies,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalComments / limit),
          totalComments,
          hasNextPage: page < Math.ceil(totalComments / limit),
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

const likeComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);
    if (!comment || comment.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    await comment.likeComment(req.user._id);
    await comment.populate('userId', 'username profilePic');

    res.status(200).json({
      success: true,
      message: 'Comment liked successfully',
      data: {
        commentId: comment._id,
        likeCount: comment.likeCount,
        isLiked: true
      }
    });
  } catch (error) {
    next(error);
  }
};

const unlikeComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);
    if (!comment || comment.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    await comment.unlikeComment(req.user._id);
    await comment.populate('userId', 'username profilePic');

    res.status(200).json({
      success: true,
      message: 'Comment unliked successfully',
      data: {
        commentId: comment._id,
        likeCount: comment.likeCount,
        isLiked: false
      }
    });
  } catch (error) {
    next(error);
  }
};

const getCommentReplies = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const parentComment = await Comment.findById(commentId);
    if (!parentComment || parentComment.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    const replies = await Comment.find({ 
      parentCommentId: commentId,
      isDeleted: false 
    })
      .populate('userId', 'username profilePic')
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit);

    const totalReplies = await Comment.countDocuments({ 
      parentCommentId: commentId,
      isDeleted: false 
    });

    res.status(200).json({
      success: true,
      data: {
        replies,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalReplies / limit),
          totalReplies,
          hasNextPage: page < Math.ceil(totalReplies / limit),
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addComment,
  replyToComment,
  deleteComment,
  getComments,
  likeComment,
  unlikeComment,
  getCommentReplies
};
