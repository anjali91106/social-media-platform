import React, { useState } from 'react';
import { postsAPI } from '../services/api';
import FileUpload from './FileUpload';

const CreatePost = ({ onPostCreated }) => {
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

      const response = await postsAPI.createPost(postData);
      
      // Reset form
      setFormData({
        caption: '',
        tags: '',
        location: '',
      });
      setMediaFiles([]);
      
      // Notify parent component
      if (onPostCreated) {
        onPostCreated(response.data.data);
      }

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      caption: '',
      tags: '',
      location: '',
    });
    setMediaFiles([]);
    setError(null);
  };

  return (
    <div className="card p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Create a Post</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
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
            rows={3}
            maxLength={2000}
            className="input resize-none"
            placeholder="What's on your mind?"
          />
          <div className="text-xs text-gray-500 mt-1">
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

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={handleCancel}
            disabled={loading}
            className="btn-secondary disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary disabled:opacity-50"
          >
            {loading ? 'Posting...' : 'Post'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePost;
