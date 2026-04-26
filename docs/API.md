# API Documentation

## Overview

This document provides comprehensive documentation for all API endpoints in the social media platform. The API follows RESTful conventions and uses JSON for data exchange.

## Base URL

- **Development**: `http://localhost:5000/api`
- **Production**: `https://your-domain.com/api`

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Token Types

- **Access Token**: Short-lived (15 minutes) token for API requests
- **Refresh Token**: Long-lived (7 days) token for obtaining new access tokens

## Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data here
  },
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information (in development mode)"
}
```

## Rate Limiting

API requests are limited to 1000 requests per 15-minute window per IP address.

---

## Authentication Endpoints

### Register User
**POST** `/auth/register`

Registers a new user account.

**Request Body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "username": "johndoe",
      "email": "john@example.com",
      "profilePic": "https://ui-avatars.com/api/?name=johndoe",
      "bio": "",
      "followers": [],
      "following": [],
      "createdAt": "2023-09-05T12:00:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "User registered successfully"
}
```

**Validation Rules:**
- `username`: 3-30 characters, alphanumeric and underscores only
- `email`: Valid email format
- `password`: Minimum 8 characters, at least one uppercase, one lowercase, one number, one special character

### Login User
**POST** `/auth/login`

Authenticates a user and returns tokens.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "username": "johndoe",
      "email": "john@example.com",
      "profilePic": "https://ui-avatars.com/api/?name=johndoe",
      "bio": "",
      "followers": [],
      "following": []
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Login successful"
}
```

### Refresh Token
**POST** `/auth/refresh`

Refreshes an expired access token using a refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Token refreshed successfully"
}
```

### Get Current User
**GET** `/auth/me`

Gets the current authenticated user's profile.

**Headers:**
```
Authorization: Bearer <access-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "username": "johndoe",
      "email": "john@example.com",
      "profilePic": "https://ui-avatars.com/api/?name=johndoe",
      "bio": "Software developer",
      "followers": ["64f8a1b2c3d4e5f6a7b8c9d1"],
      "following": ["64f8a1b2c3d4e5f6a7b8c9d2"],
      "followersCount": 1,
      "followingCount": 1
    }
  }
}
```

---

## User Management Endpoints

### Search Users
**GET** `/users/search`

Search for users by username.

**Query Parameters:**
- `q` (required): Search query string
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 10, max: 50)

**Example:**
```
GET /users/search?q=john&page=1&limit=10
```

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
        "username": "johndoe",
        "profilePic": "https://ui-avatars.com/api/?name=johndoe",
        "bio": "Software developer",
        "followersCount": 150,
        "isFollowing": false
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalUsers": 1,
      "hasNextPage": false,
      "hasPrevPage": false
    }
  }
}
```

### Get User Profile
**GET** `/users/:userId`

Get a specific user's profile information.

**Path Parameters:**
- `userId`: User ID

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "username": "johndoe",
      "profilePic": "https://example.com/profile.jpg",
      "bio": "Software developer",
      "followersCount": 150,
      "followingCount": 75,
      "postsCount": 42,
      "isFollowing": false
    }
  }
}
```

### Follow User
**POST** `/users/:userId/follow`

Follow a user.

**Path Parameters:**
- `userId`: User ID to follow

**Headers:**
```
Authorization: Bearer <access-token>
```

**Response:**
```json
{
  "success": true,
  "message": "User followed successfully",
  "data": {
    "following": true,
    "followersCount": 151
  }
}
```

### Unfollow User
**POST** `/users/:userId/unfollow`

Unfollow a user.

**Path Parameters:**
- `userId`: User ID to unfollow

**Headers:**
```
Authorization: Bearer <access-token>
```

**Response:**
```json
{
  "success": true,
  "message": "User unfollowed successfully",
  "data": {
    "following": false,
    "followersCount": 150
  }
}
```

### Update User Profile
**PUT** `/users/profile`

Update the current user's profile information.

**Headers:**
```
Authorization: Bearer <access-token>
```

**Request Body:**
```json
{
  "username": "newusername",
  "bio": "Updated bio",
  "profilePic": "https://example.com/new-profile.jpg"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "username": "newusername",
      "bio": "Updated bio",
      "profilePic": "https://example.com/new-profile.jpg"
    }
  }
}
```

### Get User Posts
**GET** `/users/:userId/posts`

Get posts created by a specific user.

**Path Parameters:**
- `userId`: User ID

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 10, max: 20)

**Response:**
```json
{
  "success": true,
  "data": {
    "posts": [
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d3",
        "caption": "My latest post!",
        "media": [
          {
            "type": "image",
            "url": "https://example.com/image.jpg",
            "publicId": "post_image_123"
          }
        ],
        "likeCount": 25,
        "commentCount": 5,
        "createdAt": "2023-09-05T10:30:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalPosts": 42,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

---

## Posts Endpoints

### Create Post
**POST** `/posts`

Create a new post.

**Headers:**
```
Authorization: Bearer <access-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "caption": "My new post!",
  "media": [
    {
      "type": "image",
      "url": "https://example.com/image.jpg",
      "publicId": "image_123",
      "width": 800,
      "height": 600
    }
  ],
  "tags": ["social", "awesome"],
  "location": "New York, NY"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Post created successfully",
  "data": {
    "post": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d3",
      "caption": "My new post!",
      "media": [
        {
          "type": "image",
          "url": "https://example.com/image.jpg",
          "publicId": "image_123"
        }
      ],
      "tags": ["social", "awesome"],
      "location": "New York, NY",
      "userId": "64f8a1b2c3d4e5f6a7b8c9d0",
      "likeCount": 0,
      "commentCount": 0,
      "createdAt": "2023-09-05T12:00:00.000Z"
    }
  }
}
```

### Get All Posts
**GET** `/posts`

Get all posts with pagination (For You feed).

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 10, max: 10)

**Response:**
```json
{
  "success": true,
  "data": {
    "posts": [
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d3",
        "caption": "My new post!",
        "media": [
          {
            "type": "image",
            "url": "https://example.com/image.jpg",
            "publicId": "image_123"
          }
        ],
        "userId": {
          "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
          "username": "johndoe",
          "profilePic": "https://example.com/profile.jpg",
          "isFollowing": true
        },
        "likeCount": 25,
        "commentCount": 5,
        "isLiked": false,
        "createdAt": "2023-09-05T10:30:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 10,
      "totalPosts": 95,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

### Get Feed Posts
**GET** `/posts/feed`

Get posts from users that the current user follows.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 10, max: 10)

**Headers:**
```
Authorization: Bearer <access-token>
```

**Response:**
Same format as `/posts` but only contains posts from followed users.

### Get Post by ID
**GET** `/posts/:postId`

Get a specific post by ID.

**Path Parameters:**
- `postId`: Post ID

**Response:**
```json
{
  "success": true,
  "data": {
    "post": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d3",
      "caption": "My new post!",
      "media": [
        {
          "type": "image",
          "url": "https://example.com/image.jpg",
          "publicId": "image_123"
        }
      ],
      "userId": {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
        "username": "johndoe",
        "profilePic": "https://example.com/profile.jpg"
      },
      "likeCount": 25,
      "commentCount": 5,
      "isLiked": false,
      "createdAt": "2023-09-05T10:30:00.000Z"
    }
  }
}
```

### Like Post
**POST** `/posts/:postId/like`

Like a post.

**Path Parameters:**
- `postId`: Post ID

**Headers:**
```
Authorization: Bearer <access-token>
```

**Response:**
```json
{
  "success": true,
  "message": "Post liked successfully",
  "data": {
    "likeCount": 26,
    "isLiked": true
  }
}
```

### Unlike Post
**POST** `/posts/:postId/unlike`

Unlike a post (same endpoint as like - toggles the like state).

**Path Parameters:**
- `postId`: Post ID

**Headers:**
```
Authorization: Bearer <access-token>
```

**Response:**
```json
{
  "success": true,
  "message": "Post unliked successfully",
  "data": {
    "likeCount": 25,
    "isLiked": false
  }
}
```

### Delete Post
**DELETE** `/posts/:postId`

Delete a post (only post author can delete).

**Path Parameters:**
- `postId`: Post ID

**Headers:**
```
Authorization: Bearer <access-token>
```

**Response:**
```json
{
  "success": true,
  "message": "Post deleted successfully"
}
```

### Search Posts
**GET** `/posts/search`

Search posts by caption, tags, or location.

**Query Parameters:**
- `q` (required): Search query string
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 10, max: 10)

**Example:**
```
GET /posts/search?q=javascript&page=1&limit=10
```

**Response:**
Same format as `/posts` but filtered by search criteria.

---

## File Upload Endpoints

### Upload Profile Picture
**POST** `/upload/profile`

Upload a profile picture for the current user.

**Headers:**
```
Authorization: Bearer <access-token>
Content-Type: multipart/form-data
```

**Request Body (FormData):**
- `profilePic`: Image file (JPG, PNG, GIF, WebP, max 10MB)

**Response:**
```json
{
  "success": true,
  "message": "Profile picture uploaded successfully",
  "data": {
    "profilePic": "https://res.cloudinary.com/demo/image/upload/v1234567890/profile.jpg",
    "publicId": "profile_1234567890"
  }
}
```

### Upload Post Images
**POST** `/upload/post/images`

Upload multiple images for a post.

**Headers:**
```
Authorization: Bearer <access-token>
Content-Type: multipart/form-data
```

**Request Body (FormData):**
- `images`: Array of image files (max 5 files, each max 100MB)

**Response:**
```json
{
  "success": true,
  "message": "Images uploaded successfully",
  "data": {
    "media": [
      {
        "type": "image",
        "url": "https://res.cloudinary.com/demo/image/upload/v1234567890/post1.jpg",
        "publicId": "post_1234567890_1",
        "width": 800,
        "height": 600,
        "size": 245760
      },
      {
        "type": "image",
        "url": "https://res.cloudinary.com/demo/image/upload/v1234567890/post2.jpg",
        "publicId": "post_1234567890_2",
        "width": 1200,
        "height": 800,
        "size": 512000
      }
    ]
  }
}
```

---

## Error Codes

| Status Code | Description | Example Scenarios |
|-------------|-------------|-------------------|
| 200 | Success | Request completed successfully |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid input data, validation errors |
| 401 | Unauthorized | Missing or invalid authentication token |
| 403 | Forbidden | User doesn't have permission for the action |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource already exists (e.g., duplicate email) |
| 422 | Unprocessable Entity | Validation errors |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server-side error |

## Common Error Responses

### Validation Error (400)
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    },
    {
      "field": "password",
      "message": "Password must be at least 8 characters"
    }
  ]
}
```

### Authentication Error (401)
```json
{
  "success": false,
  "message": "Access token is required"
}
```

### Not Found Error (404)
```json
{
  "success": false,
  "message": "User not found"
}
```

### Rate Limit Error (429)
```json
{
  "success": false,
  "message": "Too many requests from this IP, please try again later."
}
```

---

## Real-time Events (Socket.io)

### Connection
Connect to the Socket.io server with JWT authentication:

```javascript
const socket = io('http://localhost:5000', {
  auth: { token: 'your-jwt-token' }
});
```

### Client to Server Events

#### Join Post Room
```javascript
socket.emit('join:post', postId);
```

#### Leave Post Room
```javascript
socket.emit('leave:post', postId);
```

#### Start Typing Indicator
```javascript
socket.emit('typing:comment', { postId });
```

#### Stop Typing Indicator
```javascript
socket.emit('stop:typing:comment', { postId });
```

### Server to Client Events

#### New Notification
```javascript
socket.on('notification', (notification) => {
  console.log('New notification:', notification);
});
```

#### Post Liked
```javascript
socket.on('post:liked', (data) => {
  console.log('Post liked:', data);
});
```

#### Post Unliked
```javascript
socket.on('post:unliked', (data) => {
  console.log('Post unliked:', data);
});
```

#### Comment Added
```javascript
socket.on('post:comment_added', (data) => {
  console.log('Comment added:', data);
});
```

#### User Followed
```javascript
socket.on('user:followed', (data) => {
  console.log('New follower:', data);
});
```

#### User Unfollowed
```javascript
socket.on('user:unfollowed', (data) => {
  console.log('User unfollowed:', data);
});
```

#### User Typing Indicator
```javascript
socket.on('user:typing', (data) => {
  console.log('User typing:', data);
});
```

#### Online Users Update
```javascript
socket.on('users:online', (onlineUsers) => {
  console.log('Online users:', onlineUsers);
});
```

---

## SDK Examples

### JavaScript/Node.js

```javascript
// Using fetch
const response = await fetch('/api/posts', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
const data = await response.json();

// Using axios
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const posts = await api.get('/posts');
```

### React Hook Example

```javascript
import { useState, useEffect } from 'react';
import axios from 'axios';

const usePosts = (page = 1) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('accessToken');
        const response = await axios.get(`/api/posts?page=${page}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setPosts(response.data.data.posts);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch posts');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [page]);

  return { posts, loading, error };
};
```

---

## Testing the API

### Using curl

```bash
# Register a user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"Test123!"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'

# Get posts (with token)
curl -X GET http://localhost:5000/api/posts \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Using Postman

1. Import the API collection (if available)
2. Set environment variables:
   - `base_url`: `http://localhost:5000/api`
   - `access_token`: Your JWT token
3. Use the `{{access_token}}` variable in the Authorization header

---

## API Versioning

The current API version is v1. Future versions will be prefixed with `/v1`, `/v2`, etc.

Backward compatibility will be maintained for at least one major version.

---

## Support

For API support:
- Check the error messages carefully
- Review the authentication requirements
- Ensure proper request formatting
- Check rate limiting status
- Open an issue on GitHub for bugs or feature requests
