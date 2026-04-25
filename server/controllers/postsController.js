const Post = require('../models/Post');
const User = require('../models/User');
const { optimizedUrl } = require('../config/cloudinary');
const { sendNotification, sendPostUpdate } = require('../utils/notifications');

const createPost = async (req, res, next) => {
  try {
    const { caption, tags, location } = req.body;
    const mediaFiles = req.files || [];

    if (mediaFiles.length === 0 && !caption) {
      return res.status(400).json({
        success: false,
        message: 'Post must have either media or caption'
      });
    }

    const media = mediaFiles.map(file => ({
      type: 'image',
      url: `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
      publicId: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      width: null,
      height: null,
      format: file.mimetype.split('/')[1],
      size: file.size
    }));

    const post = new Post({
      userId: req.user._id,
      caption,
      media,
      tags: tags ? tags.split(',').map(tag => tag.trim().toLowerCase()) : [],
      location
    });

    await post.save();
    await post.populate('userId', 'username profilePic');

    // For base64 images, just use the original media, no need for optimizedUrls
    const optimizedMedia = post.media.map(item => ({
      ...item.toObject()
    }));

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: {
        ...post.toObject(),
        media: optimizedMedia
      }
    });
  } catch (error) {
    next(error);
  }
};

const deletePost = async (req, res, next) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    if (post.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this post'
      });
    }

    await Post.findByIdAndDelete(postId);

    res.status(200).json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

const likePost = async (req, res, next) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    await post.likePost(req.user._id);
    await post.populate('userId', 'username profilePic');

    // Send notification to post author if it's not the same user
    if (post.userId._id.toString() !== req.user._id.toString()) {
      sendNotification(post.userId._id.toString(), 'new_like', {
        postId: post._id,
        likerId: req.user._id,
        likerUsername: req.user.username,
        likerProfilePic: req.user.profilePic,
        contentType: post.media.length > 0 ? 'post' : 'post'
      });
    }

    // Emit real-time update to post room
    sendPostUpdate(post._id, 'liked', {
      postId: post._id,
      likeCount: post.likeCount,
      likedBy: {
        _id: req.user._id,
        username: req.user.username,
        profilePic: req.user.profilePic
      }
    });

    res.status(200).json({
      success: true,
      message: 'Post liked successfully',
      data: {
        postId: post._id,
        likeCount: post.likeCount,
        isLiked: true
      }
    });
  } catch (error) {
    next(error);
  }
};

const unlikePost = async (req, res, next) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    await post.unlikePost(req.user._id);
    await post.populate('userId', 'username profilePic');

    // Emit real-time update to post room
    sendPostUpdate(post._id, 'unliked', {
      postId: post._id,
      likeCount: post.likeCount,
      unlikedBy: {
        _id: req.user._id,
        username: req.user.username,
        profilePic: req.user.profilePic
      }
    });

    res.status(200).json({
      success: true,
      message: 'Post unliked successfully',
      data: {
        postId: post._id,
        likeCount: post.likeCount,
        isLiked: false
      }
    });
  } catch (error) {
    next(error);
  }
};

const getFeed = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 5, 10); // Max 10 posts, default 5
    const skip = (page - 1) * limit;

    const currentUser = await User.findById(req.user._id).populate('following');
    
    const followingIds = currentUser.following.map(user => user._id);
    followingIds.push(req.user._id); // Include user's own posts

    // If user doesn't follow anyone, return empty result
    if (followingIds.length <= 1) {
      return res.status(200).json({
        success: true,
        data: {
          posts: [],
          pagination: {
            currentPage: page,
            totalPages: 0,
            totalPosts: 0,
            hasNextPage: false,
            hasPrevPage: false
          }
        }
      });
    }

    const posts = await Post.find({ userId: { $in: followingIds } })
      .populate('userId', 'username profilePic')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalPosts = await Post.countDocuments({ userId: { $in: followingIds } });

    const postsWithOptimizedMedia = posts.map(post => {
      const postObj = post.toObject();
      // For base64 images, just keep the original URL, no need for optimizedUrls
      postObj.media = post.media.map(item => ({
        ...item.toObject()
      }));
      
      // Add follow status for the post author
      if (postObj.userId && req.user) {
        postObj.userId.isFollowing = req.user.following.includes(postObj.userId._id);
      }
      
      return postObj;
    });

    res.status(200).json({
      success: true,
      data: {
        posts: postsWithOptimizedMedia,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalPosts / limit),
          totalPosts,
          hasNextPage: page < Math.ceil(totalPosts / limit),
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

const updatePost = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const { caption, tags, location } = req.body;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if user owns the post
    if (post.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own posts'
      });
    }

    // Update post fields
    if (caption !== undefined) post.caption = caption;
    if (tags !== undefined) post.tags = tags;
    if (location !== undefined) post.location = location;

    await post.save();
    await post.populate('userId', 'username profilePic');

    res.status(200).json({
      success: true,
      message: 'Post updated successfully',
      data: post
    });
  } catch (error) {
    next(error);
  }
};

const getAllPosts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 5, 10); // Max 10 posts, default 5
    const skip = (page - 1) * limit;

    const posts = await Post.find()
      .populate('userId', 'username profilePic')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalPosts = await Post.countDocuments();

    const postsWithOptimizedMedia = posts.map(post => {
      const postObj = post.toObject();
      // For base64 images, just keep the original URL, no need for optimizedUrls
      postObj.media = post.media.map(item => ({
        ...item.toObject()
      }));
      
      // Add follow status for the post author
      if (postObj.userId && req.user) {
        postObj.userId.isFollowing = req.user.following.includes(postObj.userId._id);
      }
      
      // Add counts that are missing from populate
      postObj.likeCount = post.likeCount || 0;
      postObj.commentCount = post.commentCount || 0;
      return postObj;
    });

    res.status(200).json({
      success: true,
      data: {
        posts: postsWithOptimizedMedia,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalPosts / limit),
          totalPosts,
          hasNextPage: page < Math.ceil(totalPosts / limit),
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

const getPostById = async (req, res, next) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId)
      .populate('userId', 'username profilePic');

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    res.status(200).json({
      success: true,
      data: post
    });
  } catch (error) {
    next(error);
  }
};

const getUserPosts = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ userId })
      .populate('userId', 'username profilePic')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalPosts = await Post.countDocuments({ userId });

    res.status(200).json({
      success: true,
      data: {
        posts,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalPosts / limit),
          totalPosts,
          hasNextPage: page < Math.ceil(totalPosts / limit),
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

const searchPosts = async (req, res, next) => {
  try {
    const { q } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const posts = await Post.find({
      $or: [
        { caption: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } },
        { location: { $regex: q, $options: 'i' } }
      ]
    })
      .populate('userId', 'username profilePic')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalPosts = await Post.countDocuments({
      $or: [
        { caption: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } },
        { location: { $regex: q, $options: 'i' } }
      ]
    });

    res.status(200).json({
      success: true,
      data: {
        posts,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalPosts / limit),
          totalPosts,
          hasNextPage: page < Math.ceil(totalPosts / limit),
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};
