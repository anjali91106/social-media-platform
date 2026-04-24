import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://social-media-platform-xw3z.onrender.com/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // Increased to 60 seconds for large multi-image uploads
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
            refreshToken,
          });

          const { accessToken } = response.data.data;
          localStorage.setItem('accessToken', accessToken);

          // Retry the original request
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh token failed, logout user
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  refreshToken: (refreshToken) => api.post('/auth/refresh-token', { refreshToken }),
  getCurrentUser: () => api.get('/auth/me'),
};

// Posts API
export const postsAPI = {
  getFeed: (page = 1, limit = 10) => api.get(`/posts/feed?page=${page}&limit=${limit}`),
  getAllPosts: (page = 1, limit = 10) => api.get(`/posts?page=${page}&limit=${limit}`),
  getPost: (postId) => api.get(`/posts/${postId}`),
  getUserPosts: (userId, page = 1, limit = 20) => api.get(`/posts/user/${userId}?page=${page}&limit=${limit}`),
  searchPosts: (query, page = 1, limit = 10) => api.get(`/posts/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`),
  createPost: (formData) => api.post('/posts', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  updatePost: (postId, postData) => api.put(`/posts/${postId}`, postData),
  deletePost: (postId) => api.delete(`/posts/${postId}`),
  likePost: (postId) => api.post(`/posts/${postId}/like`),
  unlikePost: (postId) => api.delete(`/posts/${postId}/like`),
};

// Comments API
export const commentsAPI = {
  getComments: (postId, page = 1, limit = 20) => 
    api.get(`/comments/posts/${postId}?page=${page}&limit=${limit}`),
  addComment: (postId, commentData) => 
    api.post(`/comments/posts/${postId}`, commentData),
  replyToComment: (postId, commentId, replyData) => 
    api.post(`/comments/posts/${postId}/comments/${commentId}/reply`, replyData),
  deleteComment: (commentId) => api.delete(`/comments/comments/${commentId}`),
  likeComment: (commentId) => api.post(`/comments/comments/${commentId}/like`),
  unlikeComment: (commentId) => api.delete(`/comments/comments/${commentId}/like`),
  getReplies: (commentId, page = 1, limit = 10) => 
    api.get(`/comments/comments/${commentId}/replies?page=${page}&limit=${limit}`),
};

// Users API
export const usersAPI = {
  getProfile: (userId) => api.get(`/users/${userId}`),
  updateProfile: (userData) => api.put('/users/profile', userData),
  deleteProfile: () => api.delete('/users/profile'),
  getFollowStats: (userId) => api.get(`/users/${userId}/follow-stats`),
  followUser: (userId) => api.post(`/users/${userId}/follow`),
  unfollowUser: (userId) => api.delete(`/users/${userId}/follow`),
  getFollowers: (userId, page = 1, limit = 20) => api.get(`/users/${userId}/followers?page=${page}&limit=${limit}`),
  getFollowing: (userId, page = 1, limit = 20) => api.get(`/users/${userId}/following?page=${page}&limit=${limit}`),
  searchUsers: (query, page = 1, limit = 10) => api.get(`/users/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`),
  uploadProfilePic: (formData) => {
    const uploadApi = axios.create({
      baseURL: API_BASE_URL,
      timeout: 60000,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    // Add auth token
    const token = localStorage.getItem('accessToken');
    if (token) {
      uploadApi.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    
    return uploadApi.post('/users/upload-profile-pic', formData);
  },
};

// Upload API
export const uploadAPI = {
  uploadProfileImage: (formData) => api.post('/upload/profile', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  uploadPostImages: (formData) => api.post('/upload/post/images', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  uploadPostVideo: (formData) => api.post('/upload/post/video', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
};

export default api;
