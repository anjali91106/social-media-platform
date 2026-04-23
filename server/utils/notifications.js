const socketManager = require('../config/socket');

const createNotification = (type, data) => {
  const baseNotification = {
    id: Date.now().toString(),
    type,
    timestamp: new Date().toISOString(),
    read: false
  };

  switch (type) {
    case 'new_like':
      return {
        ...baseNotification,
        title: 'New Like',
        message: `${data.likerUsername} liked your ${data.contentType}`,
        data: {
          postId: data.postId,
          likerId: data.likerId,
          likerUsername: data.likerUsername,
          likerProfilePic: data.likerProfilePic,
          contentType: data.contentType
        }
      };

    case 'new_comment':
      return {
        ...baseNotification,
        title: 'New Comment',
        message: `${data.commenterUsername} commented on your ${data.contentType}`,
        data: {
          postId: data.postId,
          commentId: data.commentId,
          commenterId: data.commenterId,
          commenterUsername: data.commenterUsername,
          commenterProfilePic: data.commenterProfilePic,
          commentText: data.commentText,
          contentType: data.contentType
        }
      };

    case 'new_follower':
      return {
        ...baseNotification,
        title: 'New Follower',
        message: `${data.followerUsername} started following you`,
        data: {
          followerId: data.followerId,
          followerUsername: data.followerUsername,
          followerProfilePic: data.followerProfilePic
        }
      };

    case 'comment_reply':
      return {
        ...baseNotification,
        title: 'Comment Reply',
        message: `${data.replierUsername} replied to your comment`,
        data: {
          postId: data.postId,
          commentId: data.commentId,
          replyId: data.replyId,
          replierId: data.replierId,
          replierUsername: data.replierUsername,
          replierProfilePic: data.replierProfilePic,
          replyText: data.replyText
        }
      };

    default:
      return baseNotification;
  }
};

const sendNotification = (userId, type, data) => {
  const notification = createNotification(type, data);
  
  // Send real-time notification if user is online
  if (socketManager.isUserOnline(userId)) {
    socketManager.emitNotification(userId, notification);
  }
  
  return notification;
};

const sendPostUpdate = (postId, event, data) => {
  socketManager.emitPostUpdate(postId, event, data);
};

const sendUserUpdate = (userId, event, data) => {
  socketManager.emitUserUpdate(userId, event, data);
};

module.exports = {
  createNotification,
  sendNotification,
  sendPostUpdate,
  sendUserUpdate
};
