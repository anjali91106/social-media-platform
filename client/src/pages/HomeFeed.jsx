import React, { useState, useEffect, useRef, useCallback } from 'react';
import { postsAPI } from '../services/api';
import { usersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Comments from '../components/Comments';
import socketService from '../services/socket';

const HomeFeed = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showComments, setShowComments] = useState(false);
  const [activeTab, setActiveTab] = useState('forYou'); // 'forYou' or 'following'
  const { user } = useAuth();
  const observer = useRef();
  const lastPostRef = useRef();

  const fetchPosts = async (pageNum = 1, append = false) => {
    try {
      if (!append) setLoading(true);
      let response;
      
      if (activeTab === 'forYou') {
        // Get all posts (For You)
        response = await postsAPI.getAllPosts(pageNum, 10);
      } else {
        // Get posts from followed users (Following)
        response = await postsAPI.getFeed(pageNum, 10);
      }
      
      const newPosts = response.data.data.posts;
      
      setPosts(prev => append ? [...prev, ...newPosts] : newPosts);
      setHasMore(response.data.data.pagination.hasNextPage);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  // Infinite scroll observer
  const lastPostElementRef = useCallback(node => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchPosts(nextPage, true);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore, page]);

  useEffect(() => {
    // Reset posts and page when tab changes
    setPosts([]);
    setPage(1);
    setHasMore(true);
    fetchPosts();
  }, [activeTab]);

  useEffect(() => {
    fetchPosts();
    
    // Connect to socket
    if (user && user.accessToken) {
      socketService.connect(user.accessToken);
      
      // Listen for real-time updates
      const handlePostLiked = (data) => {
        setPosts(prev => prev.map(post => 
          post._id === data.postId 
            ? { ...post, likeCount: data.likeCount, isLiked: true }
            : post
        ));
      };

      const handlePostUnliked = (data) => {
        setPosts(prev => prev.map(post => 
          post._id === data.postId 
            ? { ...post, likeCount: data.likeCount, isLiked: false }
            : post
        ));
      };

      socketService.onPostLiked(handlePostLiked);
      socketService.onPostUnliked(handlePostUnliked);
      
      return () => {
        socketService.offPostLiked(handlePostLiked);
        socketService.offPostUnliked(handlePostUnliked);
      };
    }
  }, [user]);

  // Handle tab changes to refresh posts
  useEffect(() => {
    setPage(1);
    setPosts([]);
    fetchPosts(1, false);
  }, [activeTab]);

  const handleLike = async (postId) => {
    try {
      // Check if already liked
      const post = posts.find(p => p._id === postId);
      if (post && post.isLiked) {
        console.log('Post already liked');
        return;
      }
      
      await postsAPI.likePost(postId);
      setPosts(prev => prev.map(p => 
        p._id === postId 
          ? { ...p, likeCount: (p.likeCount || 0) + 1, isLiked: true }
          : p
      ));
    } catch (err) {
      console.error('Failed to like post:', err);
    }
  };

  const handleUnlike = async (postId) => {
    try {
      // Check if already unliked
      const post = posts.find(p => p._id === postId);
      if (post && !post.isLiked) {
        console.log('Post already unliked');
        return;
      }
      
      await postsAPI.unlikePost(postId);
      setPosts(prev => prev.map(p => 
        p._id === postId 
          ? { ...p, likeCount: Math.max(0, (p.likeCount || 0) - 1), isLiked: false }
          : p
      ));
    } catch (err) {
      console.error('Failed to unlike post:', err);
    }
  };

  const handleOpenComments = (post) => {
    setSelectedPost(post);
    setShowComments(true);
  };

  const handleCloseComments = () => {
    setSelectedPost(null);
    setShowComments(false);
  };

  const handleCommentAdded = (newComment) => {
    // Update the comment count for the post
    setPosts(prev => prev.map(post => 
      post._id === newComment.postId 
        ? { ...post, commentCount: (post.commentCount || 0) + 1 }
        : post
    ));
  };

  const handleFollowUser = async (userId) => {
    try {
      // Check if currently following to determine action
      const post = posts.find(p => p.userId && p.userId._id === userId);
      const isCurrentlyFollowing = post?.userId?.isFollowing;

      if (isCurrentlyFollowing) {
        // Unfollow
        await usersAPI.unfollowUser(userId);
        setPosts(prev => prev.map(p => 
          p.userId && p.userId._id === userId 
            ? { ...p, userId: { ...p.userId, isFollowing: false } }
            : p
        ));
        console.log('Unfollowed user:', userId);
      } else {
        // Follow
        await usersAPI.followUser(userId);
        setPosts(prev => prev.map(p => 
          p.userId && p.userId._id === userId 
            ? { ...p, userId: { ...p.userId, isFollowing: true } }
            : p
        ));
        console.log('Followed user:', userId);
      }
    } catch (err) {
      // Handle 400 errors gracefully (already following or not following)
      if (err.response?.status === 400) {
        const errorMessage = err.response?.data?.message || '';
        if (errorMessage.includes('Already following')) {
          console.log('Already following this user');
          // Update UI to show already following state
          setPosts(prev => prev.map(post => 
            post.userId && post.userId._id === userId 
              ? { ...post, userId: { ...post.userId, isFollowing: true } }
              : post
          ));
        } else if (errorMessage.includes('Not following')) {
          console.log('Not following this user');
          // Update UI to show not following state
          setPosts(prev => prev.map(post => 
            post.userId && post.userId._id === userId 
              ? { ...post, userId: { ...post.userId, isFollowing: false } }
              : post
          ));
        }
      } else {
        console.error('Failed to follow/unfollow user:', err);
      }
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

  
  const PostCard = ({ post, index }) => (
    <div 
      className="post-card p-6 mb-4 animate-fade-in"
      ref={index === posts.length - 1 ? lastPostElementRef : null}
    >
      {/* Post Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <img
            src={post.userId?.profilePic || 'https://ui-avatars.com/api/?name=' + (post.userId?.username || 'user') + '&background=random&color=fff&size=40'}
            alt={post.userId?.username || 'user'}
            className="w-10 h-10 rounded-full mr-3"
          />
          <div>
            <h3 className="font-semibold text-gray-900">{post.userId?.username || 'Unknown User'}</h3>
            <p className="text-sm text-gray-500">{formatDate(post.createdAt)}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Follow Button */}
          {user && user._id !== post.userId?._id && (
            <button
              className={`btn-sm text-xs px-3 py-1 transition-all duration-200 ${
                post.userId?.isFollowing 
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300' 
                  : 'btn-primary'
              }`}
              onClick={() => handleFollowUser(post.userId?._id)}
            >
              {post.userId?.isFollowing ? 'Following' : 'Follow'}
            </button>
          )}
          
          {/* Location */}
          {post.location && (
            <div className="flex items-center text-sm text-gray-500">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {post.location}
            </div>
          )}
        </div>
      </div>

      {/* Post Content */}
      {post.caption && (
        <p className="text-gray-800 mb-4 whitespace-pre-wrap">{post.caption}</p>
      )}

      {/* Media */}
      {post.media && post.media.length > 0 && (
        <div className="mb-4">
          {post.media.length === 1 ? (
            <div className="mb-2">
              {post.media[0].type === 'image' ? (
                <img
                  src={post.media[0].url}
                  alt="Post image"
                  className="w-full rounded-lg cursor-pointer hover:opacity-95 transition-opacity"
                />
              ) : (
                <video
                  src={post.media[0].url}
                  controls
                  className="w-full rounded-lg"
                />
              )}
            </div>
          ) : (
            <div className={`grid gap-2 mb-2 ${
              post.media.length === 2 ? 'grid-cols-2' : 
              post.media.length === 3 ? 'grid-cols-3' : 'grid-cols-2'
            }`}>
              {post.media.map((media, index) => (
                <div key={index} className={index === 0 && post.media.length > 2 ? 'col-span-2 row-span-2' : ''}>
                  {media.type === 'image' ? (
                    <img
                      src={media.url}
                      alt={`Post image ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg cursor-pointer hover:opacity-95 transition-opacity"
                    />
                  ) : (
                    <video
                      src={media.url}
                      controls
                      className="w-full h-full object-cover rounded-lg"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Post Actions */}
      <div className="flex items-center justify-between pt-4 border-t">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => post.isLiked ? handleUnlike(post._id) : handleLike(post._id)}
            className={`flex items-center space-x-1 transition-all duration-200 ${
              post.isLiked 
                ? 'text-black hover:text-gray-800' 
                : 'text-gray-500 hover:text-black'
            }`}
          >
            <svg
              className="w-5 h-5"
              fill={post.isLiked ? "currentColor" : "none"}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            <span className="text-sm font-medium">{post.likeCount || 0}</span>
          </button>

          <button
            onClick={() => handleOpenComments(post)}
            className="flex items-center space-x-1 text-gray-500 hover:text-black transition-all duration-200"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <span className="text-sm font-medium">{post.commentCount || 0}</span>
          </button>

          <button className="text-gray-500 hover:text-primary-500 transition-colors">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
              />
            </svg>
          </button>
        </div>

        {/* Save button */}
        <button className="text-gray-500 hover:text-primary-500 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </button>
      </div>

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          {post.tags.map((tag, index) => (
            <span
              key={index}
              className="text-sm text-primary-600 bg-primary-50 px-2 py-1 rounded-full hover:bg-primary-100 transition-colors cursor-pointer"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );

  if (loading && posts.length === 0) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">For You</h1>
        
        {/* Tabs */}
        <div className="flex space-x-1 mb-6 border-b border-gray-200">
          <button
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-all duration-200 ${
              activeTab === 'forYou'
                ? 'text-black border-black bg-gray-100'
                : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('forYou')}
          >
            For You
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-all duration-200 ${
              activeTab === 'following'
                ? 'text-black border-black bg-gray-100'
                : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('following')}
          >
            Following
          </button>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {posts.length === 0 && !loading ? (
          <div className="text-center py-12">
            {activeTab === 'following' ? (
              <>
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <p className="text-gray-500 mb-2">You don't follow anyone yet</p>
                <p className="text-sm text-gray-400">Start following people to see their posts here!</p>
              </>
            ) : (
              <>
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <p className="text-gray-500 mb-2">No posts yet</p>
                <p className="text-sm text-gray-400">Be the first to create a post!</p>
              </>
            )}
          </div>
        ) : (
          <>
            {posts.map((post, index) => (
              <PostCard key={post._id} post={post} index={index} />
            ))}

            {/* Loading indicator for infinite scroll */}
            {loading && posts.length > 0 && (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Comments Modal */}
      {showComments && selectedPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Comments</h3>
              <button
                onClick={handleCloseComments}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
              <Comments postId={selectedPost._id} onCommentAdded={handleCommentAdded} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeFeed;
