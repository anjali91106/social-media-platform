const User = require('../models/User');
const Post = require('../models/Post');
const { optimizedUrl, deleteFile } = require('../config/cloudinary');
const { authenticate } = require('../middlewares/auth');

const uploadProfileImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Create base64 data URL for profile picture
    const profilePicUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

    // Update user profile picture
    user.profilePic = profilePicUrl;
    await user.save();

    // Return the profile picture URL (no optimization needed for base64)
    const optimizedUrls = {
      original: profilePicUrl,
      thumbnail: profilePicUrl,
      small: profilePicUrl,
      medium: profilePicUrl,
      large: profilePicUrl
    };

    res.status(200).json({
      success: true,
      message: 'Profile image uploaded successfully',
      data: {
        profilePic: user.profilePic,
        optimizedUrls
      }
    });
  } catch (error) {
    next(error);
  }
};

const uploadPostImages = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const { caption, tags, location } = req.body;

    // Process uploaded files
    const images = req.files.map(file => ({
      url: file.path,
      publicId: file.filename,
      width: file.width,
      height: file.height,
      format: file.format,
      size: file.size
    }));

    // Create new post
    const post = new Post({
      caption,
      author: req.user._id,
      images,
      tags: tags ? tags.split(',').map(tag => tag.trim().toLowerCase()) : [],
      location
    });

    await post.save();
    await post.populate('author', 'username profilePic');

    // Generate optimized URLs for each image
    const optimizedImages = post.images.map(image => ({
      ...image.toObject(),
      optimizedUrls: {
        thumbnail: optimizedUrl(image.url, { width: 200, height: 200, crop: 'thumb' }),
        small: optimizedUrl(image.url, { width: 400, height: 400, crop: 'fill' }),
        medium: optimizedUrl(image.url, { width: 800, height: 800, crop: 'fill' }),
        large: optimizedUrl(image.url, { width: 1200, height: 1200, crop: 'fill' })
      }
    }));

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: {
        ...post.toObject(),
        images: optimizedImages
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

    // Check if user is the author
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this post'
      });
    }

    // Delete all associated files from Cloudinary
    const deletePromises = post.media.map(item => deleteFile(item.url));

    await Promise.all(deletePromises);

    // Delete post from database
    await Post.findByIdAndDelete(postId);

    res.status(200).json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

const getPost = async (req, res, next) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId)
      .populate('author', 'username profilePic')
      .populate('comments.user', 'username profilePic')
      .populate('likes', 'username profilePic');

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Generate optimized URLs for images
    const optimizedImages = post.images.map(image => ({
      ...image.toObject(),
      optimizedUrls: {
        thumbnail: optimizedUrl(image.url, { width: 200, height: 200, crop: 'thumb' }),
        small: optimizedUrl(image.url, { width: 400, height: 400, crop: 'fill' }),
        medium: optimizedUrl(image.url, { width: 800, height: 800, crop: 'fill' }),
        large: optimizedUrl(image.url, { width: 1200, height: 1200, crop: 'fill' })
      }
    }));

    res.status(200).json({
      success: true,
      data: {
        ...post.toObject(),
        images: optimizedImages
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadProfileImage,
  uploadPostImages,
  deletePost,
  getPost
};
