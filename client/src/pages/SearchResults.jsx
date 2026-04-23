import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { postsAPI } from '../services/api';
import { usersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const SearchResults = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (query) {
      searchContent(query);
    }
  }, [query]);

  const searchContent = async (searchQuery) => {
    try {
      setLoading(true);
      setError(null);
      
      // Real API calls for search
      const [usersResponse, postsResponse] = await Promise.all([
        usersAPI.searchUsers(searchQuery).catch(() => ({ data: { data: { users: [] } } })),
        postsAPI.searchPosts(searchQuery).catch(() => ({ data: { data: { posts: [] } } }))
      ]);

      const users = usersResponse.data.data.users || [];
      const posts = postsResponse.data.data.posts || [];

      // Combine results
      const combinedResults = [
        ...users.map(user => ({
          id: user._id,
          type: 'user',
          username: user.username,
          profilePic: user.profilePic || 'https://ui-avatars.com/api/?name=' + user.username + '&background=random&color=fff&size=40',
          followers: user.followersCount || 0,
          bio: user.bio || '',
          isFollowing: user.isFollowing || false
        })),
        ...posts.map(post => ({
          id: post._id,
          type: 'post',
          caption: post.caption || '',
          media: post.media || [],
          likes: post.likeCount || 0,
          comments: post.commentCount || 0,
          username: post.userId?.username || 'unknown',
          profilePic: post.userId?.profilePic || 'https://ui-avatars.com/api/?name=user&background=random&color=fff&size=40',
          createdAt: post.createdAt || new Date().toISOString()
        }))
      ];

      setResults(combinedResults);
    } catch (error) {
      setError('Failed to search content');
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (userId) => {
    try {
      await usersAPI.followUser(userId);
      // Update UI to show user is now followed
      setResults(prev => prev.map(result => 
        result.id === userId && result.type === 'user'
          ? { ...result, isFollowing: true }
          : result
      ));
    } catch (err) {
      console.error('Failed to follow user:', err);
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

  const filteredResults = activeTab === 'all' 
    ? results 
    : results.filter(item => item.type === activeTab.slice(0, -1)); // Remove 's' from 'users'/'posts'

  const UserCard = ({ user }) => (
    <div 
      className="card p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => navigate(`/profile/${user.id}`)}
    >
      <div className="flex items-center space-x-4">
        <img
          src={user.profilePic}
          alt={user.username}
          className="w-16 h-16 rounded-full"
        />
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{user.username}</h3>
          <p className="text-sm text-gray-600 mb-1">{user.bio}</p>
          <p className="text-xs text-gray-500">{user.followers.toLocaleString()} followers</p>
        </div>
        {user && user._id !== user.id && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              handleFollow(user.id);
            }}
            className={`btn btn-sm ${user.isFollowing ? 'btn-secondary' : 'btn-primary'}`}
          >
            {user.isFollowing ? 'Following' : 'Follow'}
          </button>
        )}
      </div>
    </div>
  );

  const PostCard = ({ post }) => (
    <div className="card p-4 hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex items-center mb-3">
        <img
          src={post.profilePic}
          alt={post.username}
          className="w-8 h-8 rounded-full mr-3"
        />
        <div>
          <h4 className="font-medium text-gray-900">{post.username}</h4>
          <p className="text-xs text-gray-500">{formatDate(post.createdAt)}</p>
        </div>
      </div>
      
      {post.media && post.media.length > 0 && (
        <div className="mb-3">
          <img
            src={post.media[0]}
            alt="Post image"
            className="w-full rounded-lg"
          />
        </div>
      )}
      
      <p className="text-gray-800 mb-3">{post.caption}</p>
      
      <div className="flex items-center space-x-4 text-sm text-gray-500">
        <span className="flex items-center space-x-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span>{post.likes}</span>
        </span>
        <span className="flex items-center space-x-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span>{post.comments}</span>
        </span>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        {/* Search Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Search Results for "{query}"
          </h1>
          <p className="text-gray-600">
            Found {results.length} results
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('all')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'all'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              All ({results.length})
            </button>
            <button
              onClick={() => setActiveTab('posts')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'posts'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Posts ({results.filter(r => r.type === 'post').length})
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Users ({results.filter(r => r.type === 'user').length})
            </button>
          </nav>
        </div>

        {/* Results */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="text-gray-500 mb-2">No results found</p>
              <p className="text-sm text-gray-400">Try different keywords or check your spelling</p>
            </div>
          ) : (
            filteredResults.map(result => (
              result.type === 'user' ? (
                <UserCard key={result.id} user={result} />
              ) : (
                <PostCard key={result.id} post={result} />
              )
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchResults;
