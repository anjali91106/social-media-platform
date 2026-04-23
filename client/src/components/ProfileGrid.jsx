import React, { useState } from 'react';
import { postsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import EditPostModal from './EditPostModal';

const ProfileGrid = ({ userId, onPostClick }) => {
  const { user: currentUser } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editPost, setEditPost] = useState(null);

  const fetchUserPosts = async (pageNum = 1, append = false) => {
    try {
      setLoading(true);
      console.log('Fetching posts for userId:', userId);
      const response = await postsAPI.getUserPosts(userId, pageNum, 20);
      console.log('API response:', response);
      console.log('Response data structure:', response.data);
      
      const newPosts = response.data?.data?.posts || response.data?.posts || [];
      console.log('Extracted posts:', newPosts);
      
      setPosts(prev => append ? [...prev, ...newPosts] : newPosts);
      setHasMore(response.data?.data?.pagination?.hasNextPage || response.data?.pagination?.hasNextPage || false);
      setError(null);
    } catch (err) {
      console.error('Error fetching user posts:', err);
      setError(err.response?.data?.message || 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchUserPosts();
  }, [userId]);

  const handlePostClick = (post) => {
    setSelectedPost(post);
    if (onPostClick) {
      onPostClick(post);
    }
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchUserPosts(nextPage, true);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) {
      return;
    }

    setDeleteLoading(true);
    try {
      await postsAPI.deletePost(postId);
      setPosts(prev => prev.filter(post => post._id !== postId));
      setSelectedPost(null);
      console.log('Post deleted successfully');
    } catch (err) {
      console.error('Failed to delete post:', err);
      alert('Failed to delete post. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleEditPost = (post) => {
    setEditPost(post);
    setSelectedPost(null);
  };

  const isOwnPost = (post) => {
    return currentUser && (post.userId === currentUser._id || post.userId?._id === currentUser._id);
  };

  const handlePostUpdated = (updatedPost) => {
    setPosts(prev => prev.map(post => 
      post._id === updatedPost._id ? updatedPost : post
    ));
  };

  if (loading && posts.length === 0) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="text-gray-500 mb-2">No posts yet</p>
        <p className="text-sm text-gray-400">Start creating and sharing your moments</p>
      </div>
    );
  }

  return (
    <div>
      {/* Grid */}
      <div className="grid grid-cols-3 gap-1 md:gap-2">
        {posts.map((post, index) => (
          <div
            key={post._id}
            className="relative aspect-square cursor-pointer group overflow-hidden"
            onClick={() => handlePostClick(post)}
          >
            <img
              src={post.media && post.media[0] ? post.media[0].url : 'https://picsum.photos/seed/default/300/300.jpg'}
              alt={`Post ${index + 1}`}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            
            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
              <div className="flex items-center space-x-4 text-white px-3">
                <div className="flex items-center space-x-1">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span>{post.likeCount || post.likes || 0}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span>{post.commentCount || post.comments || 0}</span>
                </div>
                {/* Three-dot menu for own posts */}
                {isOwnPost(post) && (
                  <div className="absolute top-2 right-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditPost(post);
                      }}
                      className="text-white hover:text-blue-300 p-1"
                      title="Edit post"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="text-center mt-8">
          <button
            onClick={handleLoadMore}
            disabled={loading}
            className="btn-secondary disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}

      {/* Post Modal */}
      {selectedPost && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedPost(null)}
        >
          <div 
            className="max-w-4xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-lg flex flex-col md:flex-row h-full">
              {/* Image */}
              <div className="md:w-1/2 bg-black flex items-center justify-center">
                <img
                  src={selectedPost.media && selectedPost.media[0] ? selectedPost.media[0].url : 'https://picsum.photos/seed/default/400/400.jpg'}
                  alt="Post"
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              
              {/* Content */}
              <div className="md:w-1/2 flex flex-col">
                {/* Header */}
                <div className="p-4 border-b flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <img
                      src={selectedPost.userId?.profilePic || 'https://picsum.photos/seed/avatar/40/40.jpg'}
                      alt={selectedPost.userId?.username || 'Username'}
                      className="w-8 h-8 rounded-full"
                    />
                    <div>
                      <p className="font-medium">{selectedPost.userId?.username || 'Username'}</p>
                      <p className="text-xs text-gray-500">2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {isOwnPost(selectedPost) && (
                      <>
                        <button
                          onClick={() => handleEditPost(selectedPost)}
                          className="text-gray-500 hover:text-blue-600"
                          title="Edit post"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeletePost(selectedPost._id)}
                          disabled={deleteLoading}
                          className="text-gray-500 hover:text-red-600 disabled:opacity-50"
                          title="Delete post"
                        >
                          {deleteLoading ? (
                            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setSelectedPost(null)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                {/* Caption */}
                <div className="flex-1 p-4 overflow-y-auto">
                  <p className="font-medium mb-2">{selectedPost.userId?.username || 'Username'}</p>
                  <p className="text-gray-800">{selectedPost.caption || 'No caption'}</p>
                </div>
                
                {/* Actions */}
                <div className="p-4 border-t">
                  <div className="flex items-center space-x-4 mb-4">
                    <button className="flex items-center space-x-1 text-gray-700 hover:text-red-500">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      <span>{selectedPost.likeCount || selectedPost.likes || 0}</span>
                    </button>
                    <button className="flex items-center space-x-1 text-gray-700 hover:text-blue-500">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <span>{selectedPost.commentCount || selectedPost.comments || 0}</span>
                    </button>
                  </div>
                  <p className="text-sm text-gray-500">
                    {selectedPost.likeCount || selectedPost.likes || 0} likes · {selectedPost.commentCount || selectedPost.comments || 0} comments
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Post Modal */}
      {editPost && (
        <EditPostModal
          post={editPost}
          onClose={() => setEditPost(null)}
          onPostUpdated={handlePostUpdated}
        />
      )}
    </div>
  );
};

export default ProfileGrid;
