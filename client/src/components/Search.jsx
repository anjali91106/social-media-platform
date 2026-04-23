import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { usersAPI, postsAPI } from '../services/api';

const Search = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const searchRef = useRef(null);
  const inputRef = useRef(null);

  const searchContent = async (searchQuery) => {
    try {
      setLoading(true);
      
      if (!searchQuery.trim()) {
        setResults([]);
        return;
      }

      const [usersResponse, postsResponse] = await Promise.all([
        usersAPI.searchUsers(searchQuery).catch(() => ({ data: { data: { users: [] } } })),
        postsAPI.searchPosts(searchQuery).catch(() => ({ data: { data: { posts: [] } } }))
      ]);

      const users = usersResponse.data.data.users || [];
      const posts = postsResponse.data.data.posts || [];

      const combinedResults = [
        ...users.map(user => ({
          id: user._id,
          type: 'user',
          username: user.username,
          profilePic: user.profilePic || 'https://ui-avatars.com/api/?name=' + user.username + '&background=random&color=fff&size=40',
          followers: user.followersCount || 0,
          bio: user.bio || ''
        })),
        ...posts.map(post => ({
          id: post._id,
          type: 'post',
          caption: post.caption || '',
          media: post.media || [],
          likes: post.likeCount || 0,
          username: post.userId?.username || 'unknown',
          profilePic: post.userId?.profilePic || 'https://ui-avatars.com/api/?name=user&background=random&color=fff&size=40'
        }))
      ];

      setResults(combinedResults);
      setError(null);
    } catch (error) {
      setError('Failed to search content');
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query) {
        searchContent(query);
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleInputChange = (e) => {
    setQuery(e.target.value);
    setIsOpen(true);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleResultClick = (result) => {
    if (result.type === 'user') {
      navigate(`/profile/${result.id}`);
    } else if (result.type === 'post') {
      navigate(`/post/${result.id}`);
    }
    setIsOpen(false);
    setQuery('');
  };

  const handleViewAllResults = () => {
    navigate(`/search?q=${encodeURIComponent(query)}`);
    setIsOpen(false);
  };

  const SearchResultItem = ({ result }) => (
    <div
      className="flex items-center p-3 hover:bg-gray-50 cursor-pointer transition-colors"
      onClick={() => handleResultClick(result)}
    >
      {result.type === 'user' ? (
        <>
          <img
            src={result.profilePic}
            alt={result.username}
            className="w-10 h-10 rounded-full mr-3"
          />
          <div className="flex-1">
            <p className="font-medium text-gray-900">{result.username}</p>
            <p className="text-sm text-gray-500">{result.followers} followers</p>
          </div>
          <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            User
          </div>
        </>
      ) : (
        <>
          <img
            src={result.media[0]}
            alt="Post thumbnail"
            className="w-10 h-10 rounded object-cover mr-3"
          />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 truncate">{result.username}</p>
            <p className="text-sm text-gray-500 truncate">{result.caption}</p>
          </div>
          <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            Post
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="relative" ref={searchRef}>
      {/* Search Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder="Search users, posts, tags..."
          className="w-64 md:w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (query || loading) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
            </div>
          ) : results.length > 0 ? (
            <>
              <div className="max-h-80 overflow-y-auto">
                {results.map(result => (
                  <SearchResultItem key={result.id} result={result} />
                ))}
              </div>
              <div className="border-t border-gray-200 p-3">
                <button
                  onClick={handleViewAllResults}
                  className="w-full text-center text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  View all results for "{query}"
                </button>
              </div>
            </>
          ) : query ? (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="text-sm">No results found for "{query}"</p>
              <p className="text-xs text-gray-400 mt-1">Try different keywords</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default Search;
