import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usersAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { PROFILE_UPDATE_EVENT } from '../utils/events';

// Custom event for profile updates
class ProfileUpdateEvent extends CustomEvent {
  constructor(detail) {
    super('profile_update', { detail });
  }
}

const SettingsPage = () => {
  const { user, logout, dispatch } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [profileData, setProfileData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    profilePic: user?.profilePic || '',
    bio: user?.bio || ''
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        username: user.username,
        email: user.email,
        profilePic: user.profilePic,
        bio: user.bio || ''
      });
    }
  }, [user]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      let updateData = {
        username: profileData.username,
        bio: profileData.bio,
        profilePic: profileData.profilePic
      };

      // If there's a new profile picture file, upload it first
      if (profileData.profilePicFile) {
        const formData = new FormData();
        formData.append('profilePic', profileData.profilePicFile);
        
        try {
          const uploadResponse = await usersAPI.uploadProfilePic(formData);
          updateData.profilePic = uploadResponse.data.data.url;
          
          // Update the profileData state with the new URL to replace the blob URL
          setProfileData(prev => ({
            ...prev,
            profilePic: uploadResponse.data.data.url,
            profilePicFile: null // Clear the file reference
          }));
        } catch (uploadError) {
          console.error('Profile picture upload failed:', uploadError);
          setError('Failed to upload profile picture');
          setLoading(false);
          return;
        }
      }

      await usersAPI.updateProfile(updateData);
      setMessage('Profile updated successfully!');
      
      // Update the user context to trigger re-render across the app
      if (dispatch) {
        // Trigger a user context refresh with updated profile data
        const updatedUser = { 
          ...user, 
          bio: profileData.bio,
          profilePic: updateData.profilePic // Use the updated profile picture URL
        };
        dispatch({ type: 'LOAD_USER_SUCCESS', payload: { user: updatedUser } });
      }
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Profile update error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update profile. Please try again.';
      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProfile = async () => {
    if (!window.confirm('Are you sure you want to delete your profile? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      await usersAPI.deleteProfile();
      logout();
      navigate('/register');
    } catch (error) {
      console.error('Profile deletion error:', error);
      setMessage('Failed to delete profile. Please try again.');
      setLoading(false);
    }
  };

  const handleInputChange = (field) => (e) => {
    setProfileData(prev => {
      const newData = {
        ...prev,
        [field]: e.target.value
      };
      return newData;
    });
  };

  const handleProfilePicChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError('Profile picture must be less than 5MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    try {
      // Create a preview URL for immediate display
      const previewUrl = URL.createObjectURL(file);
      setProfileData(prev => ({
        ...prev,
        profilePic: previewUrl,
        profilePicFile: file
      }));
      setError(null);
    } catch (error) {
      console.error('Error handling profile picture:', error);
      setError('Failed to process profile picture');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Please log in to access settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <button
              onClick={logout}
              className="btn-secondary"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto py-8">
        <div className="max-w-2xl mx-auto">
          <div className="card">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile Settings</h2>
              
              {/* Success/Error Message */}
              {message && (
                <div className={`mb-6 p-4 rounded ${
                  message.includes('successfully') 
                    ? 'bg-green-50 border-green-200 text-green-700' 
                    : 'bg-red-50 border-red-200 text-red-700'
                }`}>
                  {message}
                </div>
              )}

              {/* Profile Form */}
              <form onSubmit={handleProfileUpdate} className="space-y-6">
                {/* Profile Picture */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Profile Picture
                  </label>
                  <div className="flex items-center space-x-6">
                    <div className="flex-shrink-0">
                      <img
                        className="h-20 w-20 rounded-full object-cover"
                        src={profileData.profilePic || 'https://ui-avatars.com/api/?name=' + (user?.username || 'user') + '&background=random&color=fff&size=80'}
                        alt="Profile"
                        onError={(e) => {
                          e.target.src = 'https://ui-avatars.com/api/?name=' + (user?.username || 'user') + '&background=random&color=fff&size=80';
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProfilePicChange}
                        className="hidden"
                        id="profile-pic-upload"
                      />
                      <label
                        htmlFor="profile-pic-upload"
                        className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        Upload Photo
                      </label>
                      <p className="text-xs text-gray-500 mt-1">
                        JPG, PNG or GIF. Max size 5MB.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Username */}
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={profileData.username}
                    onChange={handleInputChange('username')}
                    className="input"
                    disabled={loading}
                  />
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={profileData.email}
                    onChange={handleInputChange('email')}
                    className="input"
                    disabled={loading}
                  />
                </div>

                {/* Bio */}
                <div>
                  <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
                    Bio
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={profileData.bio}
                    onChange={handleInputChange('bio')}
                    rows={4}
                    maxLength={200}
                    className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black focus:border-gray-500 resize-none"
                    placeholder="Tell us about yourself..."
                    disabled={loading}
                  />
                </div>

                {/* Profile Picture */}
                <div>
                  <label htmlFor="profilePic" className="block text-sm font-medium text-gray-700 mb-2">
                    Profile Picture URL
                  </label>
                  <input
                    type="url"
                    id="profilePic"
                    name="profilePic"
                    value={profileData.profilePic}
                    onChange={handleInputChange('profilePic')}
                    className="input"
                    placeholder="https://example.com/profile-pic.jpg"
                    disabled={loading}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary"
                  >
                    {loading ? 'Updating...' : 'Update Profile'}
                  </button>

                  <button
                    type="button"
                    onClick={handleDeleteProfile}
                    disabled={loading}
                    className="btn-secondary text-red-600 hover:text-red-700"
                  >
                    Delete Profile
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

export default SettingsPage;
