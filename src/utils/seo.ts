/**
 * SEO utilities for dynamic meta tag management and structured data
 */

interface MetaTag {
  name?: string;
  property?: string;
  content: string;
}

interface StructuredData {
  '@context': string;
  '@type': string;
  [key: string]: any;
}

export class SEOManager {
  private static instance: SEOManager;

  private constructor() {}

  static getInstance(): SEOManager {
    if (!SEOManager.instance) {
      SEOManager.instance = new SEOManager();
    }
    return SEOManager.instance;
  }

  // Update page title
  setTitle(title: string): void {
    document.title = title;
    this.updateMetaTag('og:title', title);
    this.updateMetaTag('twitter:title', title);
  }

  // Update meta description
  setDescription(description: string): void {
    this.updateMetaTag('description', description);
    this.updateMetaTag('og:description', description);
    this.updateMetaTag('twitter:description', description);
  }

  // Update canonical URL
  setCanonicalUrl(url: string): void {
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = url;
    this.updateMetaTag('og:url', url);
  }

  // Update meta tag
  private updateMetaTag(nameOrProperty: string, content: string): void {
    const isProperty = nameOrProperty.startsWith('og:') || nameOrProperty.startsWith('twitter:');
    const selector = isProperty ? `meta[property="${nameOrProperty}"]` : `meta[name="${nameOrProperty}"]`;
    
    let meta = document.querySelector(selector) as HTMLMetaElement;
    if (!meta) {
      meta = document.createElement('meta');
      if (isProperty) {
        meta.setAttribute('property', nameOrProperty);
      } else {
        meta.setAttribute('name', nameOrProperty);
      }
      document.head.appendChild(meta);
    }
    meta.content = content;
  }

  // Add structured data
  addStructuredData(data: StructuredData): void {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
  }

  // Generate token page SEO data
  setTokenPageSEO(tokenName: string, tokenId: string, price?: string, roi?: string): void {
    const title = `${tokenName} (${tokenId.toUpperCase()}) - Legion ICO Performance | Degion.xyz`;
    const description = `Track ${tokenName} token performance with real-time price${price ? ` ($${price})` : ''}, ROI${roi ? ` (${roi})` : ''}, and community sentiment. Comprehensive analytics and investment tracking.`;
    
    this.setTitle(title);
    this.setDescription(description);
    this.setCanonicalUrl(`https://degion.xyz/${tokenId}`);

    // Add token-specific structured data
    const tokenData: StructuredData = {
      '@context': 'https://schema.org',
      '@type': 'FinancialProduct',
      name: `${tokenName} Token`,
      identifier: tokenId.toUpperCase(),
      description: `${tokenName} token from Legion ICO platform`,
      provider: {
        '@type': 'Organization',
        name: 'Legion'
      },
      url: `https://degion.xyz/${tokenId}`
    };

    if (price) {
      tokenData.offers = {
        '@type': 'Offer',
        price: price.replace('$', ''),
        priceCurrency: 'USD'
      };
    }

    this.addStructuredData(tokenData);
  }

  // Generate discussion page SEO data
  setDiscussionPageSEO(tokenName: string, tokenId: string): void {
    const title = `${tokenName} Discussions - Community Sentiment & Analysis | Degion.xyz`;
    const description = `Join the ${tokenName} community discussion. Share insights, analysis, and sentiment about ${tokenName} token performance and future prospects.`;
    
    this.setTitle(title);
    this.setDescription(description);
    this.setCanonicalUrl(`https://degion.xyz/${tokenId}/discussions`);
  }

  // Generate breadcrumb structured data
  addBreadcrumbData(items: Array<{ name: string; url: string }>): void {
    const breadcrumbData: StructuredData = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: item.url
      }))
    };

    this.addStructuredData(breadcrumbData);
  }

  // Add FAQ structured data
  addFAQData(faqs: Array<{ question: string; answer: string }>): void {
    const faqData: StructuredData = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map(faq => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer
        }
      }))
    };

    this.addStructuredData(faqData);
  }

  // Generate sitemap data (for client-side sitemap generation)
  generateSitemapUrls(tokens: Array<{ id: string; name: string }>): string[] {
    const baseUrls = [
      'https://degion.xyz',
      'https://degion.xyz/about',
      'https://degion.xyz/contact'
    ];

    const tokenUrls = tokens.flatMap(token => [
      `https://degion.xyz/${token.id}`,
      `https://degion.xyz/${token.id}/discussions`
    ]);

    return [...baseUrls, ...tokenUrls];
  }
}

// Export singleton instance
export const seoManager = SEOManager.getInstance();

// Utility functions for common SEO tasks
export const seoUtils = {
  // Generate meta keywords from token data
  generateKeywords: (tokenName: string, status: string, additionalKeywords: string[] = []): string => {
    const baseKeywords = [
      tokenName,
      'Legion ICO',
      'cryptocurrency',
      'token tracking',
      'DeFi',
      'blockchain',
      'investment',
      'ROI',
      status.toLowerCase()
    ];

    return [...baseKeywords, ...additionalKeywords].join(', ');
  },

  // Generate Open Graph image URL
  generateOGImage: (tokenName: string, price?: string, roi?: string): string => {
    const params = new URLSearchParams({
      token: tokenName,
      ...(price && { price }),
      ...(roi && { roi })
    });
    
    return `https://degion.xyz/api/og-image?${params.toString()}`;
  },

  // Validate and clean meta content
  cleanMetaContent: (content: string, maxLength: number = 160): string => {
    return content
      .replace(/[<>]/g, '') // Remove HTML brackets
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
      .substring(0, maxLength);
  },

  // Generate schema.org rating from sentiment data
  generateRating: (rocketVotes: number, poopVotes: number): any => {
    const totalVotes = rocketVotes + poopVotes;
    if (totalVotes === 0) return null;

    const positiveRatio = rocketVotes / totalVotes;
    const ratingValue = Math.round(positiveRatio * 5 * 10) / 10; // 0-5 scale with 1 decimal

    return {
      '@type': 'AggregateRating',
      ratingValue: ratingValue.toString(),
      bestRating: '5',
      worstRating: '0',
      ratingCount: totalVotes.toString()
    };
  }
};