import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { seoManager } from '../utils/seo';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonicalUrl?: string;
  structuredData?: any;
}

export const SEOHead = ({ 
  title, 
  description, 
  keywords, 
  canonicalUrl,
  structuredData 
}: SEOHeadProps) => {
  const location = useLocation();

  useEffect(() => {
    // Set default values if not provided
    const defaultTitle = 'Degion.xyz - Track Legion ICO Performance & Token Analytics';
    const defaultDescription = 'Track Legion ICO token performance with real-time prices, ROI calculations, and community sentiment. Comprehensive analytics for Fuel, Silencio, Corn, Giza and more.';
    
    // Update title
    if (title) {
      seoManager.setTitle(title);
    } else {
      seoManager.setTitle(defaultTitle);
    }

    // Update description
    if (description) {
      seoManager.setDescription(description);
    } else {
      seoManager.setDescription(defaultDescription);
    }

    // Update keywords
    if (keywords) {
      const meta = document.querySelector('meta[name="keywords"]') as HTMLMetaElement;
      if (meta) {
        meta.content = keywords;
      }
    }

    // Update canonical URL
    const fullUrl = canonicalUrl || `https://degion.xyz${location.pathname}`;
    seoManager.setCanonicalUrl(fullUrl);

    // Add structured data
    if (structuredData) {
      seoManager.addStructuredData(structuredData);
    }
  }, [title, description, keywords, canonicalUrl, structuredData, location.pathname]);

  return null; // This component doesn't render anything
};