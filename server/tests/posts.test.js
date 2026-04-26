/**
 * Posts Tests
 * Comprehensive test suite for posts endpoints
 */

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const Post = require('../models/Post');

describe('Posts Endpoints', () => {
  let server;
  let testUser = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'Test123!@#'
  };
  let accessToken;
  let testUserId;

  beforeAll(async () => {
    // Connect to test database
    const mongoUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/social-media-test';
    await mongoose.connect(mongoUri);
    
    // Start server for testing
    server = app.listen(0);
  });

  afterAll(async () => {
    // Clean up test data
    await User.deleteMany({});
    await Post.deleteMany({});
    await mongoose.connection.close();
    await server.close();
  });

  beforeEach(async () => {
    // Clean up before each test
    await User.deleteMany({});
    await Post.deleteMany({});

    // Register and login to get token
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    accessToken = registerResponse.body.data.accessToken;
    testUserId = registerResponse.body.data.user._id;
  });

  describe('POST /api/posts', () => {
    it('should create a new post successfully', async () => {
      const postData = {
        caption: 'This is a test post',
        tags: ['test', 'post'],
        location: 'Test Location'
      };

      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(postData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.caption).toBe(postData.caption);
      expect(response.body.data.tags).toEqual(postData.tags);
      expect(response.body.data.location).toBe(postData.location);
      expect(response.body.data.userId._id).toBe(testUserId);
    });

    it('should return error without authentication', async () => {
      const postData = {
        caption: 'This is a test post'
      };

      const response = await request(app)
        .post('/api/posts')
        .send(postData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('token');
    });

    it('should return error for empty post', async () => {
      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('media or caption');
    });

    it('should create post with tags array', async () => {
      const postData = {
        caption: 'Post with tags',
        tags: 'javascript, react, testing'
      };

      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(postData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tags).toEqual(['javascript', 'react', 'testing']);
    });
  });

  describe('GET /api/posts', () => {
    beforeEach(async () => {
      // Create test posts
      const posts = [
        { caption: 'First post', userId: testUserId },
        { caption: 'Second post', userId: testUserId },
        { caption: 'Third post', userId: testUserId }
      ];

      for (const post of posts) {
        await new Post(post).save();
      }
    });

    it('should get all posts with pagination', async () => {
      const response = await request(app)
        .get('/api/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.posts).toHaveLength(3);
      expect(response.body.data.pagination).toBeDefined();
      expect(response.body.data.pagination.totalPosts).toBe(3);
      expect(response.body.data.pagination.currentPage).toBe(1);
    });

    it('should respect pagination limit', async () => {
      const response = await request(app)
        .get('/api/posts?limit=2')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.posts).toHaveLength(2);
      expect(response.body.data.pagination.hasNextPage).toBe(true);
    });

    it('should include user information in posts', async () => {
      const response = await request(app)
        .get('/api/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.posts[0].userId.username).toBe(testUser.username);
      expect(response.body.data.posts[0].userId.profilePic).toBeDefined();
    });
  });

  describe('GET /api/posts/feed', () => {
    let otherUser;
    let otherUserToken;

    beforeEach(async () => {
      // Create another user
      const otherUserData = {
        username: 'otheruser',
        email: 'other@example.com',
        password: 'Test123!@#'
      };

      const otherUserResponse = await request(app)
        .post('/api/auth/register')
        .send(otherUserData);

      otherUser = otherUserResponse.body.data.user;
      otherUserToken = otherUserResponse.body.data.accessToken;

      // Follow other user
      await request(app)
        .post(`/api/users/${otherUser._id}/follow`)
        .set('Authorization', `Bearer ${accessToken}`);

      // Create posts from both users
      await new Post({ caption: 'My post', userId: testUserId }).save();
      await new Post({ caption: 'Other user post', userId: otherUser._id }).save();
    });

    it('should get feed with posts from followed users', async () => {
      const response = await request(app)
        .get('/api/posts/feed')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.posts).toHaveLength(1);
      expect(response.body.data.posts[0].caption).toBe('Other user post');
    });

    it('should return empty feed for user with no follows', async () => {
      // Unfollow other user
      await request(app)
        .post(`/api/users/${otherUser._id}/unfollow`)
        .set('Authorization', `Bearer ${accessToken}`);

      const response = await request(app)
        .get('/api/posts/feed')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.posts).toHaveLength(0);
    });
  });

  describe('GET /api/posts/search', () => {
    beforeEach(async () => {
      // Create test posts with searchable content
      const posts = [
        { caption: 'JavaScript tutorial', userId: testUserId, tags: ['javascript', 'tutorial'] },
        { caption: 'React components guide', userId: testUserId, tags: ['react', 'components'] },
        { caption: 'Testing best practices', userId: testUserId, tags: ['testing', 'best-practices'] }
      ];

      for (const post of posts) {
        await new Post(post).save();
      }
    });

    it('should search posts by caption', async () => {
      const response = await request(app)
        .get('/api/posts/search?q=JavaScript')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.posts).toHaveLength(1);
      expect(response.body.data.posts[0].caption).toContain('JavaScript');
    });

    it('should search posts by tags', async () => {
      const response = await request(app)
        .get('/api/posts/search?q=react')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.posts).toHaveLength(1);
      expect(response.body.data.posts[0].tags).toContain('react');
    });

    it('should return empty results for non-matching query', async () => {
      const response = await request(app)
        .get('/api/posts/search?q=nonexistent')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.posts).toHaveLength(0);
    });

    it('should return error without search query', async () => {
      const response = await request(app)
        .get('/api/posts/search')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('query is required');
    });
  });

  describe('POST /api/posts/:postId/like', () => {
    let testPost;

    beforeEach(async () => {
      testPost = await new Post({ caption: 'Test post', userId: testUserId }).save();
    });

    it('should like a post successfully', async () => {
      const response = await request(app)
        .post(`/api/posts/${testPost._id}/like`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.likes).toContain(testUserId);
      expect(response.body.data.likeCount).toBe(1);
    });

    it('should unlike a post if already liked', async () => {
      // Like the post first
      await request(app)
        .post(`/api/posts/${testPost._id}/like`)
        .set('Authorization', `Bearer ${accessToken}`);

      // Unlike the post
      const response = await request(app)
        .post(`/api/posts/${testPost._id}/like`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.likes).not.toContain(testUserId);
      expect(response.body.data.likeCount).toBe(0);
    });

    it('should return error for non-existent post', async () => {
      const fakePostId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .post(`/api/posts/${fakePostId}/like`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });
  });

  describe('DELETE /api/posts/:postId', () => {
    let testPost;

    beforeEach(async () => {
      testPost = await new Post({ caption: 'Test post', userId: testUserId }).save();
    });

    it('should delete own post successfully', async () => {
      const response = await request(app)
        .delete(`/api/posts/${testPost._id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted successfully');

      // Verify post is deleted
      const deletedPost = await Post.findById(testPost._id);
      expect(deletedPost).toBeNull();
    });

    it('should return error when trying to delete other user post', async () => {
      // Create another user
      const otherUserResponse = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'otheruser',
          email: 'other@example.com',
          password: 'Test123!@#'
        });

      const otherUserToken = otherUserResponse.body.data.accessToken;

      const response = await request(app)
        .delete(`/api/posts/${testPost._id}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not authorized');
    });
  });
});
