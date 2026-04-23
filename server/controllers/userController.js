const User = require('../models/User');
const { sendNotification, sendUserUpdate } = require('../utils/notifications');

const followUser = async (req, res, next) => {
  try {
    
    const { userId } = req.params;
    const currentUserId = req.user._id;

    // Validate user to follow exists
    const userToFollow = await User.findById(userId);
    
    if (!userToFollow) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if trying to follow yourself
    if (currentUserId.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot follow yourself'
      });
    }

    const currentUser = await User.findById(currentUserId);

    // Check if already following
    if (currentUser.following.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Already following this user'
      });
    }

    // Use transaction to ensure data consistency
    const session = await User.startSession();
    session.startTransaction();

    try {
      // Add to current user's following list
      await currentUser.followUser(userId);
      
      // Add current user to target user's followers list
      await userToFollow.addFollower(currentUserId);

      await session.commitTransaction();
      session.endSession();

      // Get updated user data
      const updatedCurrentUser = await User.findById(currentUserId)
        .select('username profilePic followers following')
        .populate('followers', 'username profilePic')
        .populate('following', 'username profilePic');

      const updatedTargetUser = await User.findById(userId)
        .select('username profilePic followers following')
        .populate('followers', 'username profilePic')
        .populate('following', 'username profilePic');

      // Send notification to user who was followed
      sendNotification(userId, 'new_follower', {
        followerId: currentUserId,
        followerUsername: req.user.username,
        followerProfilePic: req.user.profilePic,
        contentType: 'follow'
      });

      // Emit real-time update to the followed user
      sendUserUpdate(userId, 'followed', {
        follower: {
          _id: currentUserId,
          username: req.user.username,
          profilePic: req.user.profilePic
        },
        followersCount: updatedTargetUser.followers.length
      });
      res.status(200).json({
        success: true,
        message: 'User followed successfully',
        data: {
          currentUser: updatedCurrentUser,
          targetUser: updatedTargetUser,
          isFollowing: true
        }
      });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

const unfollowUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    // Validate user to unfollow exists
    const userToUnfollow = await User.findById(userId);
    if (!userToUnfollow) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if trying to unfollow yourself
    if (currentUserId.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot unfollow yourself'
      });
    }

    const currentUser = await User.findById(currentUserId);

    // Check if not following
    if (!currentUser.following.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Not following this user'
      });
    }

    // Use transaction to ensure data consistency
    const session = await User.startSession();
    session.startTransaction();

    try {
      // Remove from current user's following list
      await currentUser.unfollowUser(userId);
      
      // Remove current user from target user's followers list
      await userToUnfollow.removeFollower(currentUserId);

      await session.commitTransaction();
      session.endSession();

      // Get updated user data
      const updatedCurrentUser = await User.findById(currentUserId)
        .select('username profilePic followers following')
        .populate('followers', 'username profilePic')
        .populate('following', 'username profilePic');

      const updatedTargetUser = await User.findById(userId)
        .select('username profilePic followers following')
        .populate('followers', 'username profilePic')
        .populate('following', 'username profilePic');

      // Emit real-time update to the unfollowed user
      sendUserUpdate(userId, 'unfollowed', {
        unfollower: {
          _id: currentUserId,
          username: req.user.username,
          profilePic: req.user.profilePic
        },
        followersCount: updatedTargetUser.followers.length
      });

      res.status(200).json({
        success: true,
        message: 'User unfollowed successfully',
        data: {
          currentUser: updatedCurrentUser,
          targetUser: updatedTargetUser,
          isFollowing: false
        }
      });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

const getFollowers = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const user = await User.findById(userId)
      .select('followers')
      .populate({
        path: 'followers',
        select: 'username profilePic',
        options: { skip, limit }
      });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const totalFollowers = await User.findById(userId).select('followers').then(u => u.followers.length);

    res.status(200).json({
      success: true,
      data: {
        followers: user.followers,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalFollowers / limit),
          totalFollowers,
          hasNextPage: page < Math.ceil(totalFollowers / limit),
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

const getFollowing = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const user = await User.findById(userId)
      .select('following')
      .populate({
        path: 'following',
        select: 'username profilePic',
        options: { skip, limit }
      });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const totalFollowing = await User.findById(userId).select('following').then(u => u.following.length);

    res.status(200).json({
      success: true,
      data: {
        following: user.following,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalFollowing / limit),
          totalFollowing,
          hasNextPage: page < Math.ceil(totalFollowing / limit),
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

const getFollowStats = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .select('username profilePic bio followers following')
      .populate('followers', 'username profilePic')
      .populate('following', 'username profilePic');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Ensure bio field exists and has default value
    if (!user.bio) {
      user.bio = '';
    }

    const currentUserId = req.user ? req.user._id : null;
    const isFollowing = currentUserId ? user.followers.some(follower => 
      follower._id && follower._id.toString() === currentUserId.toString()
    ) : false;

    res.status(200).json({
      success: true,
      data: {
        username: user.username,
        profilePic: user.profilePic,
        bio: user.bio,
        followersCount: user.followers.length,
        followingCount: user.following.length,
        isFollowing
      }
    });
  } catch (error) {
    next(error);
  }
};

const searchUsers = async (req, res, next) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;
    const currentUserId = req.user._id;
    const skip = (page - 1) * limit;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const users = await User.find({
      $or: [
        { username: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ]
    })
      .select('username profilePic bio followers following')
      .sort({ followers: -1 })
      .skip(skip)
      .limit(limit);

    // Get current user's following list to check isFollowing status
    const currentUser = await User.findById(currentUserId).select('following');
    const followingIds = currentUser.following.map(id => id.toString());

    // Ensure bio field exists and has default value for all users, and add isFollowing status
    users.forEach(user => {
      if (!user.bio) {
        user.bio = '';
      }
      
      // Add isFollowing status
      user.isFollowing = followingIds.includes(user._id.toString());
    });

    const totalUsers = await User.countDocuments({
      $or: [
        { username: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ]
    });

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalUsers / limit),
          totalUsers,
          hasNextPage: page < Math.ceil(totalUsers / limit),
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { username, email, bio, profilePic } = req.body;
    const userId = req.user._id;

    // Use the authenticated user's ID instead of the parameter
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update user fields
    if (username !== undefined) user.username = username;
    if (email !== undefined) user.email = email;
    if (bio !== undefined) {
      user.bio = bio;
    }
    if (profilePic !== undefined) user.profilePic = profilePic;

    await user.save();

    
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        username: user.username,
        email: user.email,
        bio: user.bio,
        profilePic: user.profilePic
      }
    });
  } catch (error) {
    next(error);
  }
};

const deleteProfile = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete user's posts, followers, following, etc.
    await User.findByIdAndDelete(userId);

    res.status(200).json({
      success: true,
      message: 'Profile deleted successfully'
    });
  } catch (error) {
    console.error('Profile deletion error:', error);
    next(error);
  }
};

const uploadProfilePic = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update user's profile picture with base64 data URL
    const profilePicUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    user.profilePic = profilePicUrl;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile picture uploaded successfully',
      data: {
        url: profilePicUrl,
        publicId: `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFollowStats,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  searchUsers,
  updateProfile,
  deleteProfile,
  uploadProfilePic
};
