/**
 * OptimizedImage Component Tests
 * Tests for image optimization and lazy loading functionality
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import OptimizedImage from '../OptimizedImage';

// Mock IntersectionObserver
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockReturnValue({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
});
window.IntersectionObserver = mockIntersectionObserver;

describe('OptimizedImage Component', () => {
  const defaultProps = {
    src: 'https://example.com/test-image.jpg',
    alt: 'Test image',
    className: 'test-class'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders placeholder initially', () => {
    render(<OptimizedImage {...defaultProps} />);
    
    // Check for placeholder image
    const placeholder = screen.getByRole('img', { hidden: true });
    expect(placeholder).toHaveAttribute('src', expect.stringContaining('data:image/svg+xml'));
    expect(placeholder).toHaveAttribute('aria-hidden', 'true');
  });

  it('creates IntersectionObserver on mount', () => {
    render(<OptimizedImage {...defaultProps} />);
    
    expect(mockIntersectionObserver).toHaveBeenCalled();
    expect(mockIntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function),
      { threshold: 0.1 }
    );
  });

  it('loads image when in viewport', async () => {
    let observerCallback;
    mockIntersectionObserver.mockImplementation((callback) => {
      observerCallback = callback;
      return {
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn(),
      };
    });

    render(<OptimizedImage {...defaultProps} />);
    
    // Simulate image entering viewport
    const mockEntry = {
      isIntersecting: true,
      target: { dataset: {} }
    };
    
    observerCallback([mockEntry]);
    
    await waitFor(() => {
      const actualImage = screen.getByRole('img');
      expect(actualImage).toHaveAttribute('src', defaultProps.src);
      expect(actualImage).toHaveAttribute('alt', defaultProps.alt);
    });
  });

  it('applies custom className', () => {
    render(<OptimizedImage {...defaultProps} />);
    
    const container = screen.getByRole('img', { hidden: true }).closest('div');
    expect(container).toHaveClass('test-class');
  });

  it('shows error state when image fails to load', async () => {
    let observerCallback;
    mockIntersectionObserver.mockImplementation((callback) => {
      observerCallback = callback;
      return {
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn(),
      };
    });

    render(<OptimizedImage {...defaultProps} />);
    
    // Simulate image entering viewport
    const mockEntry = { isIntersecting: true, target: {} };
    observerCallback([mockEntry]);
    
    await waitFor(() => {
      const actualImage = screen.getByRole('img');
      
      // Simulate image load error
      fireEvent.error(actualImage);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load image')).toBeInTheDocument();
    });
  });

  it('removes placeholder after successful load', async () => {
    let observerCallback;
    mockIntersectionObserver.mockImplementation((callback) => {
      observerCallback = callback;
      return {
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn(),
      };
    });

    render(<OptimizedImage {...defaultProps} />);
    
    // Simulate image entering viewport
    const mockEntry = { isIntersecting: true, target: {} };
    observerCallback([mockEntry]);
    
    await waitFor(() => {
      const actualImage = screen.getByRole('img');
      
      // Simulate successful image load
      fireEvent.load(actualImage);
    });
    
    await waitFor(() => {
      const actualImage = screen.getByRole('img');
      expect(actualImage).toHaveClass('opacity-100');
      expect(actualImage).not.toHaveAttribute('aria-hidden', 'true');
    });
  });

  it('uses custom placeholder when provided', () => {
    const customPlaceholder = 'https://example.com/custom-placeholder.jpg';
    
    render(
      <OptimizedImage 
        {...defaultProps} 
        placeholder={customPlaceholder} 
      />
    );
    
    const placeholder = screen.getByRole('img', { hidden: true });
    expect(placeholder).toHaveAttribute('src', customPlaceholder);
  });

  it('sets loading attribute to lazy by default', async () => {
    let observerCallback;
    mockIntersectionObserver.mockImplementation((callback) => {
      observerCallback = callback;
      return {
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn(),
      };
    });

    render(<OptimizedImage {...defaultProps} />);
    
    // Simulate image entering viewport
    const mockEntry = { isIntersecting: true, target: {} };
    observerCallback([mockEntry]);
    
    await waitFor(() => {
      const actualImage = screen.getByRole('img');
      expect(actualImage).toHaveAttribute('loading', 'lazy');
    });
  });

  it('allows custom loading attribute', async () => {
    let observerCallback;
    mockIntersectionObserver.mockImplementation((callback) => {
      observerCallback = callback;
      return {
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn(),
      };
    });

    render(<OptimizedImage {...defaultProps} loading="eager" />);
    
    // Simulate image entering viewport
    const mockEntry = { isIntersecting: true, target: {} };
    observerCallback([mockEntry]);
    
    await waitFor(() => {
      const actualImage = screen.getByRole('img');
      expect(actualImage).toHaveAttribute('loading', 'eager');
    });
  });

  it('passes through additional props to image element', async () => {
    let observerCallback;
    mockIntersectionObserver.mockImplementation((callback) => {
      observerCallback = callback;
      return {
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn(),
      };
    });

    render(
      <OptimizedImage 
        {...defaultProps} 
        data-testid="custom-image"
        width="300"
        height="200"
      />
    );
    
    // Simulate image entering viewport
    const mockEntry = { isIntersecting: true, target: {} };
    observerCallback([mockEntry]);
    
    await waitFor(() => {
      const actualImage = screen.getByTestId('custom-image');
      expect(actualImage).toHaveAttribute('width', '300');
      expect(actualImage).toHaveAttribute('height', '200');
    });
  });

  it('disconnects observer on unmount', () => {
    const { unmount } = render(<OptimizedImage {...defaultProps} />);
    
    const mockDisconnect = mockIntersectionObserver.mock.results[0].value.disconnect;
    
    unmount();
    
    expect(mockDisconnect).toHaveBeenCalled();
  });

  it('handles missing src gracefully', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    render(<OptimizedImage alt="Test image" />);
    
    // Should not throw error and render placeholder
    const placeholder = screen.getByRole('img', { hidden: true });
    expect(placeholder).toBeInTheDocument();
    
    consoleSpy.mockRestore();
  });

  it('applies transition classes correctly', async () => {
    let observerCallback;
    mockIntersectionObserver.mockImplementation((callback) => {
      observerCallback = callback;
      return {
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn(),
      };
    });

    render(<OptimizedImage {...defaultProps} />);
    
    // Initially should have opacity-0
    await waitFor(() => {
      const placeholder = screen.getByRole('img', { hidden: true });
      expect(placeholder).toHaveClass('opacity-0');
    });
    
    // Simulate image entering viewport and loading
    const mockEntry = { isIntersecting: true, target: {} };
    observerCallback([mockEntry]);
    
    await waitFor(() => {
      const actualImage = screen.getByRole('img');
      fireEvent.load(actualImage);
    });
    
    await waitFor(() => {
      const actualImage = screen.getByRole('img');
      expect(actualImage).toHaveClass('opacity-100');
    });
  });
});
