import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { formatSupport } from './utils/imageOptimization';
import './index.css';

// Initialize image format support detection
(async () => {
  try {
    const [webpSupported, avifSupported] = await Promise.all([
      formatSupport.supportsFormat('webp'),
      formatSupport.supportsFormat('avif')
    ]);
    
    // Add classes to document for CSS feature detection
    if (webpSupported) {
      document.documentElement.classList.add('webp-supported');
    }
    if (avifSupported) {
      document.documentElement.classList.add('avif-supported');
    }
    
    console.log('🖼️ Image format support:', { webp: webpSupported, avif: avifSupported });
  } catch (error) {
    console.warn('Failed to detect image format support:', error);
  }
})();

// Add error handling for deployment
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Failed to find the root element');
}

const root = createRoot(rootElement);

root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
