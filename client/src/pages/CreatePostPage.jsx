import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { postsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import FileUpload from '../components/FileUpload';

const CreatePostPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    caption: '',
    tags: '',
    location: '',
  });
  const [mediaFiles, setMediaFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFilesChange = (files) => {
    setMediaFiles(files);
    setError(null);
  };

  const validateForm = () => {
    if (mediaFiles.length === 0 && !formData.caption.trim()) {
      setError('Please add either media or a caption');
      return false;
    }

    if (formData.caption.length > 2000) {
      setError('Caption cannot exceed 2000 characters');
      return false;
    }

    if (formData.location.length > 100) {
      setError('Location cannot exceed 100 characters');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Prevent duplicate submissions
    if (loading) {
      console.log('Submission already in progress');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const postData = new FormData();
      
      // Add media files
      mediaFiles.forEach(file => {
        postData.append('media', file);
      });

      // Add other fields
      if (formData.caption.trim()) {
        postData.append('caption', formData.caption.trim());
      }

      if (formData.tags.trim()) {
        const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
        postData.append('tags', JSON.stringify(tagsArray));
      }

      if (formData.location.trim()) {
        postData.append('location', formData.location.trim());
      }

      console.log('Submitting post with data:', {
        caption: formData.caption,
        tags: formData.tags,
        location: formData.location,
        mediaCount: mediaFiles.length
      });

      const response = await postsAPI.createPost(postData);
      console.log('Create post response:', response);
      
      // Reset form
      setFormData({
        caption: '',
        tags: '',
        location: '',
      });
      setMediaFiles([]);
      
      // Navigate to feed
      navigate('/feed');

    } catch (err) {
      console.error('Create post error:', err);
      setError(err.response?.data?.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">SM</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Create Post</span>
            </div>
            
            <button
              onClick={() => navigate('/feed')}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto py-8">
        <div className="max-w-2xl mx-auto">
          <div className="card">
            <div className="p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Post</h1>
              
              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                  {error}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Caption */}
                <div>
                  <label htmlFor="caption" className="block text-sm font-medium text-gray-700 mb-2">
                    Caption
                  </label>
                  <textarea
                    id="caption"
                    name="caption"
                    value={formData.caption}
                    onChange={handleChange}
                    rows={6}
                    maxLength={2000}
                    className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black focus:border-gray-500 resize-none"
                    placeholder="What's on your mind?"
                  />
                  <div className="text-xs text-gray-500 mt-1 text-right">
                    {formData.caption.length}/2000 characters
                  </div>
                </div>

                {/* File Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Media
                  </label>
                  <FileUpload
                    onFilesChange={handleFilesChange}
                    accept="image/*,video/*"
                    maxSize={50 * 1024 * 1024} // 50MB
                    maxFiles={10}
                  />
                </div>

                {/* Tags */}
                <div>
                  <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
                    Tags
                  </label>
                  <input
                    id="tags"
                    name="tags"
                    type="text"
                    value={formData.tags}
                    onChange={handleChange}
                    className="input"
                    placeholder="travel, food, nature (comma separated)"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Separate tags with commas
                  </p>
                </div>

                {/* Location */}
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                    Location (optional)
                  </label>
                  <input
                    id="location"
                    name="location"
                    type="text"
                    value={formData.location}
                    onChange={handleChange}
                    maxLength={100}
                    className="input"
                    placeholder="Where are you?"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {formData.location.length}/100 characters
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary btn-lg disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                        </svg>
                        Creating...
                      </>
                    ) : (
                      'Create Post'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePostPage;
