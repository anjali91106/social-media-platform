import { useState, useEffect } from 'react';
import { useParams} from 'react-router-dom';
import { usersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ProfileGrid from '../components/ProfileGrid';
import { Link } from 'react-router-dom';
import { PROFILE_UPDATE_EVENT } from '../utils/events';

const Profile = () => {
  const { userId } = useParams();
  const { user: currentUser } = useAuth();
  const [profileUser, setProfileUser] = useState(null);
  
  // For own profile, use currentUser data directly
  const isOwnProfile = !userId || (currentUser && userId === currentUser._id);
  // Always use fetched data for non-own profiles, currentUser for own profile
  const displayUser = isOwnProfile ? currentUser : profileUser;
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [activeTab, setActiveTab] = useState('posts');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      
      // Handle case where currentUser is not available yet
      if (isOwnProfile && !currentUser) {
        setError('User data not available');
        setLoading(false);
        return;
      }
      
      const targetUserId = isOwnProfile ? currentUser._id : userId;
      
      // Fetch user stats
      const statsResponse = await usersAPI.getFollowStats(targetUserId);
      const statsData = statsResponse.data.data;
      
      setProfileUser({
        _id: targetUserId,
        username: statsData.username,
        profilePic: statsData.profilePic,
        bio: statsData.bio,
        followersCount: statsData.followersCount,
        followingCount: statsData.followingCount,
      });
      
      setIsFollowing(statsData.isFollowing);

      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowers = async () => {
    try {
      if (isOwnProfile && !currentUser) {
        setError('User data not available');
        return;
      }
      
      const targetUserId = isOwnProfile ? currentUser._id : userId;
      const response = await usersAPI.getFollowers(targetUserId);
      setFollowers(response.data.data.followers);
      setActiveTab('followers');
    } catch (err) {
      console.error('Failed to fetch followers:', err);
    }
  };

  const fetchFollowing = async () => {
    try {
      if (isOwnProfile && !currentUser) {
        setError('User data not available');
        return;
      }
      
      const targetUserId = isOwnProfile ? currentUser._id : userId;
      const response = await usersAPI.getFollowing(targetUserId);
      setFollowing(response.data.data.following);
      setActiveTab('following');
    } catch (err) {
      console.error('Failed to fetch following:', err);
    }
  };

  // Listen for profile update events from SettingsPage
  useEffect(() => {
    const handleProfileUpdate = async () => {
      try {
        if (isOwnProfile && !currentUser) {
          setError('User data not available');
          return;
        }
        
        const targetUserId = isOwnProfile ? currentUser._id : userId;
        
        const response = await usersAPI.getFollowStats(targetUserId);
        const statsData = response.data.data;
        
        setProfileUser({
          _id: targetUserId,
          username: statsData.username,
          profilePic: statsData.profilePic,
          bio: statsData.bio,
          followersCount: statsData.followersCount,
          followingCount: statsData.followingCount,
        });
        
        setIsFollowing(statsData.isFollowing);
        setFollowers(statsData.followers);
        setFollowing(statsData.following);
        
        setError(null);
      } catch (err) {
        console.error('handleProfileUpdate error:', err);
        setError(err.response?.data?.message || 'Failed to load profile');
      }
    };

    // Add event listener for profile updates
    window.addEventListener(PROFILE_UPDATE_EVENT, handleProfileUpdate);
    
    return () => {
      window.removeEventListener(PROFILE_UPDATE_EVENT, handleProfileUpdate);
    };
  }, [isOwnProfile, currentUser, userId, currentUser?.profilePic]);

  useEffect(() => {
    if (currentUser && (userId || currentUser._id)) {
      fetchProfileData();
    }
  }, [userId, currentUser]);

  // Watch for user context changes to update bio in real-time
  useEffect(() => {
    
    // Force refresh profile data when profile picture changes
    if (isOwnProfile && currentUser && currentUser.profilePic) {
      fetchProfileData();
    }
    
    // Update profileUser when currentUser changes (for own profile)
    if (isOwnProfile && currentUser) {
      setProfileUser(prev => {
        const updatedProfile = {
          ...prev,
          _id: currentUser._id,
          username: currentUser.username,
          profilePic: currentUser.profilePic,
          bio: currentUser.bio,
          followersCount: prev?.followersCount || 0,
          followingCount: prev?.followingCount || 0,
        };
        return updatedProfile;
      });
    }
    
    // Update profileUser when currentUser changes (for other profiles too)
    if (!isOwnProfile && currentUser) {
      setProfileUser(prev => {
        const updatedProfile = {
          ...prev,
          _id: prev._id,
          username: prev.username,
          profilePic: prev.profilePic,
          bio: prev.bio,
          followersCount: prev?.followersCount || 0,
          followingCount: prev?.followingCount || 0,
        };
        return updatedProfile;
      });
    }
  }, [currentUser, isOwnProfile]);

  const handleFollow = async () => {
    if (!profileUser || followLoading) return;
    
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await usersAPI.unfollowUser(profileUser._id);
        setIsFollowing(false);
        setProfileUser(prev => ({
          ...prev,
          followersCount: prev.followersCount - 1
        }));
      } else {
        await usersAPI.followUser(profileUser._id);
        setIsFollowing(true);
        setProfileUser(prev => ({
          ...prev,
          followersCount: prev.followersCount + 1
        }));
      }
    } catch (err) {
      console.error('Failed to follow/unfollow:', err);
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  if (!displayUser) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <p className="text-gray-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <div className="card p-6 mb-6">
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-8">
            <img
              src={profileUser?.profilePic || 'https://ui-avatars.com/api/?name=' + (profileUser?.username || 'user') + '&background=random&color=fff&size=200'}
              alt={profileUser?.username || 'user'}
              className="w-24 h-24 rounded-full object-cover"
              onLoad={(e) => {
        // Profile image loaded successfully
      }}
              onError={(e) => {
        // Fallback to avatar
        e.target.src = 'https://ui-avatars.com/api/?name=' + (profileUser?.username || 'user') + '&background=random&color=fff&size=200';
      }}
            />
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{profileUser.username}</h1>
              <div className="flex justify-center md:justify-start space-x-6 mb-4">
                <div>
                  <span className="font-semibold">{profileUser.followersCount}</span>
                  <span className="text-gray-500 ml-1">followers</span>
                </div>
                <div>
                  <span className="font-semibold">{profileUser.followingCount}</span>
                  <span className="text-gray-500 ml-1">following</span>
                </div>
              </div>
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Bio</h2>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {displayUser?.bio || 'No bio yet'}
                  </p>
                  {/* Debug info */}
                  {/* <div className="text-xs text-gray-500 mt-2">
                    Debug: bio="{displayUser?.bio}", bioType="{typeof displayUser?.bio}"
                  </div> */}
                  {/* <div className="text-xs text-gray-500 mt-1">
                    displayUser object: {JSON.stringify(displayUser, null, 2)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    isOwnProfile: {isOwnProfile.toString()}
                  </div> */}
                </div>
              <div className="bg-white shadow-sm">
                <div className="container mx-auto py-4">
                  <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900 mb-6">{profileUser?.username || 'Profile'}</h1>
                    <div className="flex items-center space-x-4">
                      {!isOwnProfile && (
                        <button
                          onClick={handleFollow}
                          disabled={followLoading}
                          className={`btn ${
                            isFollowing 
                              ? 'btn-secondary' 
                              : 'btn-primary'
                          } disabled:opacity-50`}
                        >
                          {followLoading ? 'Loading...' : isFollowing ? 'Following' : 'Follow'}
                        </button>
                      )}
                      {isOwnProfile && (
                        <Link
                          to="/settings"
                          className="btn-secondary btn-sm"
                        >
                          Settings
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="card">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('posts')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'posts'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <svg className="w-5 h-5 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Posts
              </button>
              <button
                onClick={() => {
                  setActiveTab('followers');
                  fetchFollowers();
                }}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'followers'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Followers
              </button>
              <button
                onClick={() => {
                  setActiveTab('following');
                  fetchFollowing();
                }}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'following'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Following
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="min-h-[400px]">
            {activeTab === 'posts' && (
              <ProfileGrid userId={profileUser._id} onPostClick={(post) => console.log('Post clicked:', post)} />
            )}

            {activeTab === 'followers' && (
              <div>
                {followers.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No followers yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {followers.map(follower => (
                      <div key={follower._id} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded">
                        <div className="flex items-center space-x-3">
                          <img
                            src={follower.profilePic}
                            alt={follower.username}
                            className="w-10 h-10 rounded-full"
                          />
                          <div>
                            <h3 className="font-medium text-gray-900">{follower.username}</h3>
                          </div>
                        </div>
                        <button className="btn-primary btn-sm">
                          Follow
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'following' && (
              <div>
                {following.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500">Not following anyone yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {following.map(followedUser => (
                      <div key={followedUser._id} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded">
                        <div className="flex items-center space-x-3">
                          <img
                            src={followedUser.profilePic}
                            alt={followedUser.username}
                            className="w-10 h-10 rounded-full"
                          />
                          <div>
                            <h3 className="font-medium text-gray-900">{followedUser.username}</h3>
                          </div>
                        </div>
                        <button className="btn-secondary btn-sm">
                          Following
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
