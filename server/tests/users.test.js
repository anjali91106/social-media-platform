/**
 * Users Tests
 * Comprehensive test suite for user management endpoints
 */

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const Post = require('../models/Post');

describe('Users Endpoints', () => {
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

  describe('GET /api/users/search', () => {
    beforeEach(async () => {
      // Create additional test users
      const users = [
        { username: 'john_doe', email: 'john@example.com', password: 'Test123!@#' },
        { username: 'jane_smith', email: 'jane@example.com', password: 'Test123!@#' },
        { username: 'bob_wilson', email: 'bob@example.com', password: 'Test123!@#' }
      ];

      for (const userData of users) {
        await new User(userData).save();
      }
    });

    it('should search users by username', async () => {
      const response = await request(app)
        .get('/api/users/search?q=john')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toHaveLength(1);
      expect(response.body.data.users[0].username).toBe('john_doe');
    });

    it('should return multiple results for partial match', async () => {
      const response = await request(app)
        .get('/api/users/search?q=j')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toHaveLength(2); // john_doe, jane_smith
    });

    it('should return empty results for non-matching query', async () => {
      const response = await request(app)
        .get('/api/users/search?q=nonexistent')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toHaveLength(0);
    });

    it('should include follow status in search results', async () => {
      // Follow one of the users
      const johnUser = await User.findOne({ username: 'john_doe' });
      await request(app)
        .post(`/api/users/${johnUser._id}/follow`)
        .set('Authorization', `Bearer ${accessToken}`);

      const response = await request(app)
        .get('/api/users/search?q=john')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users[0].isFollowing).toBe(true);
    });
  });

  describe('POST /api/users/:userId/follow', () => {
    let otherUser;

    beforeEach(async () => {
      // Create another user to follow
      otherUser = await new User({
        username: 'otheruser',
        email: 'other@example.com',
        password: 'Test123!@#'
      }).save();
    });

    it('should follow user successfully', async () => {
      const response = await request(app)
        .post(`/api/users/${otherUser._id}/follow`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('followed successfully');

      // Verify follow relationship
      const currentUser = await User.findById(testUserId);
      const followedUser = await User.findById(otherUser._id);

      expect(currentUser.following).toContain(otherUser._id);
      expect(followedUser.followers).toContain(testUserId);
    });

    it('should return error when trying to follow yourself', async () => {
      const response = await request(app)
        .post(`/api/users/${testUserId}/follow`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('follow yourself');
    });

    it('should return error when already following user', async () => {
      // Follow the user first
      await request(app)
        .post(`/api/users/${otherUser._id}/follow`)
        .set('Authorization', `Bearer ${accessToken}`);

      // Try to follow again
      const response = await request(app)
        .post(`/api/users/${otherUser._id}/follow`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already following');
    });

    it('should return error for non-existent user', async () => {
      const fakeUserId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .post(`/api/users/${fakeUserId}/follow`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });
  });

  describe('POST /api/users/:userId/unfollow', () => {
    let otherUser;

    beforeEach(async () => {
      // Create another user
      otherUser = await new User({
        username: 'otheruser',
        email: 'other@example.com',
        password: 'Test123!@#'
      }).save();

      // Follow the user first
      await request(app)
        .post(`/api/users/${otherUser._id}/follow`)
        .set('Authorization', `Bearer ${accessToken}`);
    });

    it('should unfollow user successfully', async () => {
      const response = await request(app)
        .post(`/api/users/${otherUser._id}/unfollow`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('unfollowed successfully');

      // Verify unfollow relationship
      const currentUser = await User.findById(testUserId);
      const unfollowedUser = await User.findById(otherUser._id);

      expect(currentUser.following).not.toContain(otherUser._id);
      expect(unfollowedUser.followers).not.toContain(testUserId);
    });

    it('should return error when not following user', async () => {
      // Unfollow first
      await request(app)
        .post(`/api/users/${otherUser._id}/unfollow`)
        .set('Authorization', `Bearer ${accessToken}`);

      // Try to unfollow again
      const response = await request(app)
        .post(`/api/users/${otherUser._id}/unfollow`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not following');
    });

    it('should return error when trying to unfollow yourself', async () => {
      const response = await request(app)
        .post(`/api/users/${testUserId}/unfollow`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('unfollow yourself');
    });
  });

  describe('GET /api/users/:userId', () => {
    let otherUser;

    beforeEach(async () => {
      // Create another user
      otherUser = await new User({
        username: 'otheruser',
        email: 'other@example.com',
        password: 'Test123!@#',
        bio: 'This is my bio'
      }).save();

      // Create some posts for the other user
      await new Post({
        caption: 'First post',
        userId: otherUser._id
      }).save();

      await new Post({
        caption: 'Second post',
        userId: otherUser._id
      }).save();
    });

    it('should get user profile successfully', async () => {
      const response = await request(app)
        .get(`/api/users/${otherUser._id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.username).toBe('otheruser');
      expect(response.body.data.user.bio).toBe('This is my bio');
      expect(response.body.data.user.postsCount).toBe(2);
      expect(response.body.data.user.followersCount).toBe(0);
      expect(response.body.data.user.followingCount).toBe(0);
    });

    it('should include follow status in profile', async () => {
      // Follow the user
      await request(app)
        .post(`/api/users/${otherUser._id}/follow`)
        .set('Authorization', `Bearer ${accessToken}`);

      const response = await request(app)
        .get(`/api/users/${otherUser._id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.isFollowing).toBe(true);
    });

    it('should return error for non-existent user', async () => {
      const fakeUserId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .get(`/api/users/${fakeUserId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });
  });

  describe('PUT /api/users/profile', () => {
    it('should update user profile successfully', async () => {
      const updateData = {
        username: 'updateduser',
        bio: 'Updated bio',
        profilePic: 'https://example.com/new-pic.jpg'
      };

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.username).toBe('updateduser');
      expect(response.body.data.user.bio).toBe('Updated bio');
      expect(response.body.data.user.profilePic).toBe('https://example.com/new-pic.jpg');
    });

    it('should return error for duplicate username', async () => {
      // Create another user
      await new User({
        username: 'takenusername',
        email: 'taken@example.com',
        password: 'Test123!@#'
      }).save();

      const updateData = {
        username: 'takenusername'
      };

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already taken');
    });

    it('should return error without authentication', async () => {
      const updateData = {
        username: 'updateduser'
      };

      const response = await request(app)
        .put('/api/users/profile')
        .send(updateData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('token');
    });
  });

  describe('GET /api/users/:userId/posts', () => {
    let otherUser;
    let userPosts;

    beforeEach(async () => {
      // Create another user
      otherUser = await new User({
        username: 'otheruser',
        email: 'other@example.com',
        password: 'Test123!@#'
      }).save();

      // Create posts for the other user
      userPosts = [
        { caption: 'First post', userId: otherUser._id },
        { caption: 'Second post', userId: otherUser._id },
        { caption: 'Third post', userId: otherUser._id }
      ];

      for (const postData of userPosts) {
        await new Post(postData).save();
      }

      // Create posts for current user (should not appear in results)
      await new Post({ caption: 'My post', userId: testUserId }).save();
    });

    it('should get user posts successfully', async () => {
      const response = await request(app)
        .get(`/api/users/${otherUser._id}/posts`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.posts).toHaveLength(3);
      expect(response.body.data.pagination.totalPosts).toBe(3);

      // Verify posts belong to the correct user
      response.body.data.posts.forEach(post => {
        expect(post.userId._id).toBe(otherUser._id.toString());
      });
    });

    it('should respect pagination', async () => {
      const response = await request(app)
        .get(`/api/users/${otherUser._id}/posts?limit=2&page=1`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.posts).toHaveLength(2);
      expect(response.body.data.pagination.hasNextPage).toBe(true);
    });

    it('should return empty posts for user with no posts', async () => {
      // Create a user with no posts
      const emptyUser = await new User({
        username: 'emptyuser',
        email: 'empty@example.com',
        password: 'Test123!@#'
      }).save();

      const response = await request(app)
        .get(`/api/users/${emptyUser._id}/posts`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.posts).toHaveLength(0);
      expect(response.body.data.pagination.totalPosts).toBe(0);
    });
  });
});
