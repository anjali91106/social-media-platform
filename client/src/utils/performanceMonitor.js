/**
 * Performance Monitoring Utility
 * Tracks and reports application performance metrics
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      navigation: {},
      resources: [],
      userInteractions: [],
      errors: []
    };
    this.observers = new Map();
    this.isMonitoring = process.env.NODE_ENV === 'production';
  }

  /**
   * Initialize performance monitoring
   */
  init() {
    if (!this.isMonitoring) return;

    // Monitor page navigation
    this.observeNavigation();
    
    // Monitor resource loading
    this.observeResources();
    
    // Monitor user interactions
    this.observeUserInteractions();
    
    // Monitor errors
    this.observeErrors();
    
    // Monitor Core Web Vitals
    this.observeWebVitals();
  }

  /**
   * Monitor page navigation performance
   */
  observeNavigation() {
    if ('performance' in window && 'getEntriesByType' in performance) {
      const navigationEntries = performance.getEntriesByType('navigation');
      
      if (navigationEntries.length > 0) {
        const nav = navigationEntries[0];
        this.metrics.navigation = {
          dns: nav.domainLookupEnd - nav.domainLookupStart,
          tcp: nav.connectEnd - nav.connectStart,
          ssl: nav.secureConnectionStart > 0 ? nav.connectEnd - nav.secureConnectionStart : 0,
          ttfb: nav.responseStart - nav.requestStart,
          download: nav.responseEnd - nav.responseStart,
          domLoad: nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart,
          windowLoad: nav.loadEventEnd - nav.loadEventStart,
          total: nav.loadEventEnd - nav.navigationStart
        };
      }
    }
  }

  /**
   * Monitor resource loading performance
   */
  observeResources() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'resource') {
            this.metrics.resources.push({
              name: entry.name,
              type: this.getResourceType(entry.name),
              duration: entry.duration,
              size: entry.transferSize || 0,
              cached: entry.transferSize === 0 && entry.decodedBodySize > 0
            });
          }
        });
      });
      
      observer.observe({ entryTypes: ['resource'] });
      this.observers.set('resources', observer);
    }
  }

  /**
   * Monitor user interactions
   */
  observeUserInteractions() {
    const interactionTypes = ['click', 'scroll', 'keydown'];
    
    interactionTypes.forEach(type => {
      const handler = (event) => {
        this.metrics.userInteractions.push({
          type,
          timestamp: Date.now(),
          target: event.target.tagName || 'unknown',
          elementId: event.target.id || null,
          className: event.target.className || null
        });
      };
      
      document.addEventListener(type, handler, { passive: true });
    });
  }

  /**
   * Monitor JavaScript errors
   */
  observeErrors() {
    window.addEventListener('error', (event) => {
      this.metrics.errors.push({
        type: 'javascript',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        timestamp: Date.now(),
        stack: event.error?.stack
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.metrics.errors.push({
        type: 'promise',
        message: event.reason?.message || 'Unhandled promise rejection',
        timestamp: Date.now(),
        stack: event.reason?.stack
      });
    });
  }

  /**
   * Monitor Core Web Vitals
   */
  observeWebVitals() {
    // Largest Contentful Paint (LCP)
    this.observeLCP();
    
    // First Input Delay (FID)
    this.observeFID();
    
    // Cumulative Layout Shift (CLS)
    this.observeCLS();
  }

  /**
   * Monitor Largest Contentful Paint
   */
  observeLCP() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        
        this.metrics.lcp = {
          value: lastEntry.startTime,
          element: lastEntry.element?.tagName || 'unknown',
          url: lastEntry.url || '',
          timestamp: Date.now()
        };
      });
      
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.set('lcp', observer);
    }
  }

  /**
   * Monitor First Input Delay
   */
  observeFID() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'first-input') {
            this.metrics.fid = {
              value: entry.processingStart - entry.startTime,
              inputType: entry.name,
              timestamp: Date.now()
            };
          }
        });
      });
      
      observer.observe({ entryTypes: ['first-input'] });
      this.observers.set('fid', observer);
    }
  }

  /**
   * Monitor Cumulative Layout Shift
   */
  observeCLS() {
    if ('PerformanceObserver' in window) {
      let clsValue = 0;
      
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        
        this.metrics.cls = {
          value: clsValue,
          timestamp: Date.now()
        };
      });
      
      observer.observe({ entryTypes: ['layout-shift'] });
      this.observers.set('cls', observer);
    }
  }

  /**
   * Get resource type from URL
   */
  getResourceType(url) {
    if (url.includes('.js')) return 'script';
    if (url.includes('.css')) return 'stylesheet';
    if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) return 'image';
    if (url.match(/\.(woff|woff2|ttf|eot)$/i)) return 'font';
    if (url.includes('/api/')) return 'api';
    return 'other';
  }

  /**
   * Get performance metrics summary
   */
  getMetrics() {
    return {
      ...this.metrics,
      summary: this.generateSummary()
    };
  }

  /**
   * Generate performance summary
   */
  generateSummary() {
    const summary = {
      pageLoadTime: this.metrics.navigation.total || 0,
      resourceCount: this.metrics.resources.length,
      errorCount: this.metrics.errors.length,
      interactionCount: this.metrics.userInteractions.length
    };

    // Add Core Web Vitals
    if (this.metrics.lcp) summary.lcp = this.metrics.lcp.value;
    if (this.metrics.fid) summary.fid = this.metrics.fid.value;
    if (this.metrics.cls) summary.cls = this.metrics.cls.value;

    // Resource performance by type
    const resourceStats = {};
    this.metrics.resources.forEach(resource => {
      if (!resourceStats[resource.type]) {
        resourceStats[resource.type] = {
          count: 0,
          totalDuration: 0,
          totalSize: 0,
          cachedCount: 0
        };
      }
      
      resourceStats[resource.type].count++;
      resourceStats[resource.type].totalDuration += resource.duration;
      resourceStats[resource.type].totalSize += resource.size;
      if (resource.cached) resourceStats[resource.type].cachedCount++;
    });

    summary.resourceStats = resourceStats;
    return summary;
  }

  /**
   * Send metrics to analytics service
   */
  async sendMetrics() {
    if (!this.isMonitoring) return;

    try {
      const metrics = this.getMetrics();
      
      // Send to your analytics service
      await fetch('/api/analytics/performance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metrics)
      });
    } catch (error) {
      console.warn('Failed to send performance metrics:', error);
    }
  }

  /**
   * Monitor component render performance
   */
  measureComponentRender(componentName, renderFn) {
    if (!this.isMonitoring) return renderFn();

    const startTime = performance.now();
    const result = renderFn();
    const endTime = performance.now();

    this.metrics.components = this.metrics.components || [];
    this.metrics.components.push({
      name: componentName,
      duration: endTime - startTime,
      timestamp: Date.now()
    });

    return result;
  }

  /**
   * Clean up observers
   */
  cleanup() {
    this.observers.forEach(observer => {
      observer.disconnect();
    });
    this.observers.clear();
  }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor();

// Auto-initialize in production
if (process.env.NODE_ENV === 'production') {
  // Initialize after page load
  if (document.readyState === 'complete') {
    performanceMonitor.init();
  } else {
    window.addEventListener('load', () => {
      performanceMonitor.init();
    });
  }

  // Send metrics before page unload
  window.addEventListener('beforeunload', () => {
    performanceMonitor.sendMetrics();
  });
}

export default performanceMonitor;
