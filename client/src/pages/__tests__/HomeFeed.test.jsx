/**
 * HomeFeed Component Tests
 * Tests for the main feed functionality including infinite scroll and real-time updates
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';
import HomeFeed from '../HomeFeed';

// Mock API calls
jest.mock('../../services/api', () => ({
  postsAPI: {
    getAllPosts: jest.fn(),
    getFeed: jest.fn(),
    likePost: jest.fn(),
    unlikePost: jest.fn(),
    addComment: jest.fn()
  },
  usersAPI: {
    followUser: jest.fn(),
    unfollowUser: jest.fn()
  }
}));

// Mock socket service
jest.mock('../../services/socket', () => ({
  default: {
    connect: jest.fn(),
    disconnect: jest.fn(),
    onPostLiked: jest.fn(),
    offPostLiked: jest.fn(),
    onPostUnliked: jest.fn(),
    offPostUnliked: jest.fn(),
    joinPost: jest.fn(),
    leavePost: jest.fn()
  }
}));

// Mock IntersectionObserver for infinite scroll
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockReturnValue({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
});
window.IntersectionObserver = mockIntersectionObserver;

// Test wrapper component
const TestWrapper = ({ children }) => (
  <BrowserRouter>
    <AuthProvider>
      {children}
    </AuthProvider>
  </BrowserRouter>
);

describe('HomeFeed Component', () => {
  const mockUser = {
    _id: 'user123',
    username: 'testuser',
    email: 'test@example.com',
    accessToken: 'test-token'
  };

  const mockPosts = [
    {
      _id: 'post1',
      caption: 'First post',
      userId: {
        _id: 'user123',
        username: 'testuser',
        profilePic: 'https://example.com/pic.jpg',
        isFollowing: false
      },
      media: [],
      likeCount: 5,
      commentCount: 2,
      isLiked: false,
      createdAt: '2023-01-01T00:00:00.000Z'
    },
    {
      _id: 'post2',
      caption: 'Second post',
      userId: {
        _id: 'user456',
        username: 'otheruser',
        profilePic: 'https://example.com/pic2.jpg',
        isFollowing: true
      },
      media: [
        {
          type: 'image',
          url: 'https://example.com/image.jpg',
          publicId: 'image123'
        }
      ],
      likeCount: 10,
      commentCount: 3,
      isLiked: true,
      createdAt: '2023-01-02T00:00:00.000Z'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock auth context
    jest.spyOn(require('react'), 'useContext').mockImplementation(() => ({
      user: mockUser,
      isAuthenticated: true,
      loading: false,
      login: jest.fn(),
      logout: jest.fn(),
      register: jest.fn()
    }));

    // Mock successful API responses
    require('../../services/api').postsAPI.getAllPosts.mockResolvedValue({
      data: {
        data: {
          posts: mockPosts,
          pagination: {
            currentPage: 1,
            totalPages: 1,
            totalPosts: 2,
            hasNextPage: false,
            hasPrevPage: false
          }
        }
      }
    });

    require('../../services/api').postsAPI.getFeed.mockResolvedValue({
      data: {
        data: {
          posts: mockPosts,
          pagination: {
            currentPage: 1,
            totalPages: 1,
            totalPosts: 2,
            hasNextPage: false,
            hasPrevPage: false
          }
        }
      }
    });
  });

  it('renders loading state initially', () => {
    render(
      <TestWrapper>
        <HomeFeed />
      </TestWrapper>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders posts after loading', async () => {
    render(
      <TestWrapper>
        <HomeFeed />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('First post')).toBeInTheDocument();
      expect(screen.getByText('Second post')).toBeInTheDocument();
    });
  });

  it('displays tab navigation', () => {
    render(
      <TestWrapper>
        <HomeFeed />
      </TestWrapper>
    );

    expect(screen.getByText('For You')).toBeInTheDocument();
    expect(screen.getByText('Following')).toBeInTheDocument();
  });

  it('switches between tabs correctly', async () => {
    render(
      <TestWrapper>
        <HomeFeed />
      </TestWrapper>
    );

    const followingTab = screen.getByText('Following');
    
    await act(async () => {
      fireEvent.click(followingTab);
    });

    expect(require('../../services/api').postsAPI.getFeed).toHaveBeenCalled();
  });

  it('handles like action', async () => {
    render(
      <TestWrapper>
        <HomeFeed />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('First post')).toBeInTheDocument();
    });

    const likeButtons = screen.getAllByText('Like');
    const firstLikeButton = likeButtons[0];

    await act(async () => {
      fireEvent.click(firstLikeButton);
    });

    await waitFor(() => {
      expect(require('../../services/api').postsAPI.likePost).toHaveBeenCalledWith('post1');
    });
  });

  it('handles unlike action', async () => {
    render(
      <TestWrapper>
        <HomeFeed />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Second post')).toBeInTheDocument();
    });

    // Find the already liked post's like button
    const likeButtons = screen.getAllByText('Like');
    const secondLikeButton = likeButtons[1];

    await act(async () => {
      fireEvent.click(secondLikeButton);
    });

    await waitFor(() => {
      expect(require('../../services/api').postsAPI.unlikePost).toHaveBeenCalledWith('post2');
    });
  });

  it('handles follow user action', async () => {
    render(
      <TestWrapper>
        <HomeFeed />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('First post')).toBeInTheDocument();
    });

    const followButtons = screen.getAllByText('Follow');
    const firstFollowButton = followButtons[0];

    await act(async () => {
      fireEvent.click(firstFollowButton);
    });

    await waitFor(() => {
      expect(require('../../services/api').usersAPI.followUser).toHaveBeenCalledWith('user123');
    });
  });

  it('handles unfollow user action', async () => {
    render(
      <TestWrapper>
        <HomeFeed />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Second post')).toBeInTheDocument();
    });

    const followingButtons = screen.getAllByText('Following');
    const firstFollowingButton = followingButtons[0];

    await act(async () => {
      fireEvent.click(firstFollowingButton);
    });

    await waitFor(() => {
      expect(require('../../services/api').usersAPI.unfollowUser).toHaveBeenCalledWith('user456');
    });
  });

  it('displays error message when API fails', async () => {
    require('../../services/api').postsAPI.getAllPosts.mockRejectedValue(
      new Error('Network error')
    );

    render(
      <TestWrapper>
        <HomeFeed />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to load posts')).toBeInTheDocument();
    });
  });

  it('renders post media correctly', async () => {
    render(
      <TestWrapper>
        <HomeFeed />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Second post')).toBeInTheDocument();
    });

    // Check for media container
    const mediaElements = screen.getAllByRole('img');
    expect(mediaElements.length).toBeGreaterThan(0);
  });

  it('shows correct like and comment counts', async () => {
    render(
      <TestWrapper>
        <HomeFeed />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument(); // First post likes
      expect(screen.getByText('2')).toBeInTheDocument(); // First post comments
      expect(screen.getByText('10')).toBeInTheDocument(); // Second post likes
      expect(screen.getByText('3')).toBeInTheDocument(); // Second post comments
    });
  });

  it('sets up socket connection when user is authenticated', async () => {
    render(
      <TestWrapper>
        <HomeFeed />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(require('../../services/socket').default.connect).toHaveBeenCalledWith(mockUser.accessToken);
    });
  });

  it('handles real-time post like updates', async () => {
    render(
      <TestWrapper>
        <HomeFeed />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('First post')).toBeInTheDocument();
    });

    // Simulate real-time like update
    const mockCallback = require('../../services/socket').default.onPostLiked.mock.calls[0][0];
    
    act(() => {
      mockCallback({
        postId: 'post1',
        likeCount: 6,
        isLiked: true
      });
    });

    await waitFor(() => {
      expect(screen.getByText('6')).toBeInTheDocument();
    });
  });

  it('handles real-time post unlike updates', async () => {
    render(
      <TestWrapper>
        <HomeFeed />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Second post')).toBeInTheDocument();
    });

    // Simulate real-time unlike update
    const mockCallback = require('../../services/socket').default.onPostUnliked.mock.calls[0][0];
    
    act(() => {
      mockCallback({
        postId: 'post2',
        likeCount: 9,
        isLiked: false
      });
    });

    await waitFor(() => {
      expect(screen.getByText('9')).toBeInTheDocument();
    });
  });

  it('loads more posts on infinite scroll', async () => {
    // Mock additional posts for pagination
    const additionalPosts = [
      {
        _id: 'post3',
        caption: 'Third post',
        userId: {
          _id: 'user789',
          username: 'anotheruser',
          profilePic: 'https://example.com/pic3.jpg',
          isFollowing: false
        },
        media: [],
        likeCount: 1,
        commentCount: 0,
        isLiked: false,
        createdAt: '2023-01-03T00:00:00.000Z'
      }
    ];

    require('../../services/api').postsAPI.getAllPosts
      .mockResolvedValueOnce({
        data: {
          data: {
            posts: mockPosts,
            pagination: {
              currentPage: 1,
              totalPages: 2,
              totalPosts: 3,
              hasNextPage: true,
              hasPrevPage: false
            }
          }
        }
      })
      .mockResolvedValueOnce({
        data: {
          data: {
            posts: additionalPosts,
            pagination: {
              currentPage: 2,
              totalPages: 2,
              totalPosts: 3,
              hasNextPage: false,
              hasPrevPage: true
            }
          }
        }
      });

    render(
      <TestWrapper>
        <HomeFeed />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('First post')).toBeInTheDocument();
    });

    // Simulate intersection observer callback for infinite scroll
    let observerCallback;
    mockIntersectionObserver.mockImplementation((callback) => {
      observerCallback = callback;
      return {
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn(),
      };
    });

    // Trigger infinite scroll
    const mockEntry = {
      isIntersecting: true,
      target: {}
    };
    
    act(() => {
      observerCallback([mockEntry]);
    });

    await waitFor(() => {
      expect(require('../../services/api').postsAPI.getAllPosts).toHaveBeenCalledWith(2, true);
    });
  });

  it('displays user profile information correctly', async () => {
    render(
      <TestWrapper>
        <HomeFeed />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('testuser')).toBeInTheDocument();
      expect(screen.getByText('otheruser')).toBeInTheDocument();
    });
  });

  it('formats timestamps correctly', async () => {
    render(
      <TestWrapper>
        <HomeFeed />
      </TestWrapper>
    );

    await waitFor(() => {
      // Check for time elements (implementation may vary)
      const timeElements = screen.getAllByText(/\d+[hdmy] ago/);
      expect(timeElements.length).toBeGreaterThan(0);
    });
  });
});
