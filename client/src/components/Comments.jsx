import React, { useState, useEffect, useRef } from 'react';
import { commentsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import socketService from '../services/socket';

const Comments = ({ postId, onCommentAdded }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const commentInputRef = useRef(null);

  const fetchComments = async (pageNum = 1, append = false) => {
    try {
      setLoading(true);
      const response = await commentsAPI.getComments(postId, pageNum, 20);
      const newComments = response.data.data.comments;
      
      setComments(prev => append ? [...prev, ...newComments] : newComments);
      setHasMore(response.data.data.pagination.hasNextPage);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
    
    // Join post room for real-time updates
    if (postId) {
      socketService.joinPost(postId);
      
      // Listen for new comments
      const handleNewComment = (data) => {
        if (data.postId === postId) {
          setComments(prev => [data.comment, ...prev]);
        }
      };
      
      socketService.onCommentAdded(handleNewComment);
      
      return () => {
        socketService.offCommentAdded(handleNewComment);
        socketService.leavePost(postId);
      };
    }
  }, [postId]);

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;

    setSubmitting(true);
    try {
      const response = await commentsAPI.addComment(postId, {
        text: newComment.trim(),
        parentCommentId: null
      });
      
      setNewComment('');
      setComments(prev => [response.data.data, ...prev]);
      
      // Notify parent component about new comment
      if (onCommentAdded) {
        onCommentAdded(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (commentId) => {
    if (!replyText.trim() || submitting) return;

    setSubmitting(true);
    try {
      const response = await commentsAPI.replyToComment(postId, commentId, {
        text: replyText.trim()
      });
      
      setReplyText('');
      setReplyingTo(null);
      
      // Update the parent comment with the new reply
      setComments(prev => prev.map(comment => {
        if (comment._id === commentId) {
          return {
            ...comment,
            replies: [...(comment.replies || []), response.data.data]
          };
        }
        return comment;
      }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reply to comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikeComment = async (commentId) => {
    try {
      await commentsAPI.likeComment(commentId);
      setComments(prev => prev.map(comment => {
        if (comment._id === commentId) {
          return {
            ...comment,
            likeCount: (comment.likeCount || 0) + 1,
            isLiked: true
          };
        }
        return comment;
      }));
    } catch (err) {
      console.error('Failed to like comment:', err);
    }
  };

  const handleUnlikeComment = async (commentId) => {
    try {
      await commentsAPI.unlikeComment(commentId);
      setComments(prev => prev.map(comment => {
        if (comment._id === commentId) {
          return {
            ...comment,
            likeCount: Math.max(0, (comment.likeCount || 0) - 1),
            isLiked: false
          };
        }
        return comment;
      }));
    } catch (err) {
      console.error('Failed to unlike comment:', err);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    try {
      await commentsAPI.deleteComment(commentId);
      setComments(prev => prev.filter(comment => comment._id !== commentId));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete comment');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const CommentItem = ({ comment, isReply = false, parentCommentId = null }) => (
    <div className={`${isReply ? 'ml-8 border-l-2 border-gray-200 pl-4' : ''} mb-4`}>
      <div className="flex space-x-3">
        <img
          src={comment.user?.profilePic || comment.userId?.profilePic || 'https://ui-avatars.com/api/?name=User&background=random&color=fff&size=32'}
          alt={comment.user?.username || comment.userId?.username || 'User'}
          className="w-8 h-8 rounded-full"
        />
        <div className="flex-1">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-medium text-gray-900 text-sm">
                {comment.user?.username || comment.userId?.username || 'User'}
              </h4>
              <span className="text-xs text-gray-500">
                {formatDate(comment.createdAt)}
              </span>
            </div>
            <p className="text-gray-800 text-sm">{comment.text}</p>
          </div>
          
          <div className="flex items-center space-x-4 mt-2">
            <button
              onClick={() => comment.isLiked ? handleUnlikeComment(comment._id) : handleLikeComment(comment._id)}
              className={`flex items-center space-x-1 text-xs ${
                comment.isLiked ? 'text-red-500' : 'text-gray-500'
              } hover:text-red-500`}
            >
              <svg className="w-4 h-4" fill={comment.isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span>{comment.likeCount || 0}</span>
            </button>
            
            {!isReply && (
              <button
                onClick={() => setReplyingTo(comment._id)}
                className="text-xs text-gray-500 hover:text-primary-500"
              >
                Reply
              </button>
            )}
            
            {comment.userId._id === user?._id && (
              <button
                onClick={() => handleDeleteComment(comment._id)}
                className="text-xs text-gray-500 hover:text-red-500"
              >
                Delete
              </button>
            )}
          </div>

          {/* Reply Input */}
          {replyingTo === comment._id && (
            <div className="mt-3">
              <form onSubmit={(e) => handleReply(comment._id)} className="flex space-x-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Reply to ${comment.userId.username}...`}
                  className="flex-1 input text-sm"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={submitting || !replyText.trim()}
                  className="btn-primary btn-sm disabled:opacity-50"
                >
                  Reply
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setReplyingTo(null);
                    setReplyText('');
                  }}
                  className="btn-secondary btn-sm"
                >
                  Cancel
                </button>
              </form>
            </div>
          )}

          {/* Nested Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-3 space-y-3">
              {comment.replies.map(reply => (
                <CommentItem
                  key={reply._id}
                  comment={reply}
                  isReply={true}
                  parentCommentId={comment._id}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (loading && comments.length === 0) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Comments ({comments.length})
      </h3>

      {/* Add Comment Form */}
      <form onSubmit={handleSubmitComment} className="mb-6">
        <div className="flex space-x-3">
          <img
            src={user?.profilePic}
            alt={user?.username}
            className="w-8 h-8 rounded-full"
          />
          <div className="flex-1">
            <input
              ref={commentInputRef}
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="input"
              maxLength={500}
            />
          </div>
        </div>
        <div className="flex justify-end mt-2">
          <button
            type="submit"
            disabled={submitting || !newComment.trim()}
            className="btn-primary btn-sm disabled:opacity-50"
          >
            {submitting ? 'Posting...' : 'Post'}
          </button>
        </div>
      </form>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Comments List */}
      {comments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No comments yet. Be the first to comment!
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {comments.map(comment => (
              <CommentItem key={comment._id} comment={comment} />
            ))}
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="text-center mt-6">
              <button
                onClick={() => {
                  const nextPage = page + 1;
                  setPage(nextPage);
                  fetchComments(nextPage, true);
                }}
                disabled={loading}
                className="btn-secondary disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Load More Comments'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Comments;
