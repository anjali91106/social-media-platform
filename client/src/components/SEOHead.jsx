/**
 * SEO Head Component
 * Comprehensive SEO optimization for meta tags and structured data
 */

import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEOHead = ({ 
  title, 
  description, 
  image, 
  url, 
  type = 'website',
  keywords = [],
  author = null,
  publishedTime = null,
  modifiedTime = null,
  articleSection = null
}) => {
  // Default values
  const defaultTitle = 'Social Media Platform - Connect and Share';
  const defaultDescription = 'Connect with friends, share your moments, and discover what\'s happening around the world.';
  const siteUrl = import.meta.env.VITE_SITE_URL || 'https://your-domain.com';
  const siteImage = `${siteUrl}/og-image.jpg`;

  // Final values
  const finalTitle = title ? `${title} | Social Media Platform` : defaultTitle;
  const finalDescription = description || defaultDescription;
  const finalImage = image ? image.startsWith('http') ? image : `${siteUrl}${image}` : siteImage;
  const finalUrl = url ? url.startsWith('http') ? url : `${siteUrl}${url}` : siteUrl;

  // Generate structured data
  const generateStructuredData = () => {
    const baseData = {
      '@context': 'https://schema.org',
      '@type': type === 'article' ? 'Article' : 'WebSite',
      name: finalTitle,
      description: finalDescription,
      url: finalUrl,
      image: finalImage,
      publisher: {
        '@type': 'Organization',
        name: 'Social Media Platform',
        url: siteUrl,
        logo: {
          '@type': 'ImageObject',
          url: `${siteUrl}/logo.png`
        }
      }
    };

    if (type === 'article') {
      baseData.author = author ? {
        '@type': 'Person',
        name: author
      } : {
        '@type': 'Organization',
        name: 'Social Media Platform'
      };
      
      if (publishedTime) {
        baseData.datePublished = publishedTime;
      }
      
      if (modifiedTime) {
        baseData.dateModified = modifiedTime;
      }
      
      if (articleSection) {
        baseData.articleSection = articleSection;
      }
    }

    return baseData;
  };

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{finalTitle}</title>
      <meta name="description" content={finalDescription} />
      <meta name="keywords" content={keywords.join(', ')} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={finalUrl} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={finalUrl} />
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:image" content={finalImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="Social Media Platform" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={finalUrl} />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:image" content={finalImage} />
      
      {/* Additional Meta Tags */}
      <meta name="author" content={author || 'Social Media Platform'} />
      <meta name="robots" content="index, follow" />
      <meta name="googlebot" content="index, follow" />
      
      {/* Language and Geo */}
      <meta name="language" content="English" />
      <meta name="geo.region" content="US" />
      <meta name="geo.placename" content="United States" />
      
      {/* Theme and Viewport */}
      <meta name="theme-color" content="#3B82F6" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      
      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(generateStructuredData())}
      </script>
      
      {/* Preconnect to external domains */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://api.social-media-platform.com" />
      
      {/* DNS Prefetch */}
      <link rel="dns-prefetch" href="//fonts.googleapis.com" />
      <link rel="dns-prefetch" href="//cdnjs.cloudflare.com" />
      
      {/* Favicon */}
      <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="manifest" href="/site.webmanifest" />
    </Helmet>
  );
};

export default SEOHead;
