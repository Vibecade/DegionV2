import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { TronGrid } from './components/TronGrid';
import { SEOHead } from './components/SEOHead';
import { NotificationProvider } from './components/NotificationSystem';
import { PerformanceMonitor } from './components/PerformanceMonitor';
import { ErrorBoundary } from './components/ErrorBoundary';
import { BackToTopButton } from './components/BackToTopButton';
import { LoadingSpinner } from './components/LoadingSpinner';
import { useEffect } from 'react';
import { secureStorage } from './utils/security';
import { memoryMonitor } from './utils/performance';
import { isSupabaseAvailable } from './services/supabaseClient';

// Lazy load page components for code splitting
const HomePage = lazy(() => import('./pages/HomePage').then(module => ({ default: module.HomePage })));
const TokenPage = lazy(() => import('./pages/TokenPage').then(module => ({ default: module.TokenPage })));
const DiscussionPage = lazy(() => import('./pages/DiscussionPage').then(module => ({ default: module.DiscussionPage })));
const AboutPage = lazy(() => import('./pages/AboutPage').then(module => ({ default: module.AboutPage })));

// Loading fallback component
const PageLoadingFallback = () => (
  <div className="min-h-screen bg-cyber-bg text-cyber-text font-['Orbitron'] relative overflow-x-hidden flex items-center justify-center">
    <div className="glass-panel p-8 rounded-lg text-center">
      <LoadingSpinner size="lg" className="mb-4" />
      <p className="text-[#00ffee] font-orbitron">Loading page...</p>
    </div>
  </div>
);

function App() {
  useEffect(() => {
    try {
      // Clear expired cache items on app start
      secureStorage.clearExpired();
      
      // Log Supabase availability
      if (!isSupabaseAvailable) {
        console.warn('Running in offline mode - some features may be limited');
      }
      
      // Log initial memory usage in development
      if (import.meta.env.DEV) {
        memoryMonitor.logMemoryUsage('App Start');
      }
    } catch (error) {
      console.error('Error in App initialization:', error);
    }
  }, []);

  return (
    <NotificationProvider>
      <ErrorBoundary>
        <Router>
          <SEOHead />
          <div className="min-h-screen bg-cyber-bg text-cyber-text font-['Orbitron'] relative overflow-x-hidden">
            <TronGrid />
            <div className="relative z-10">
              <Suspense fallback={<PageLoadingFallback />}>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/:tokenId" element={<TokenPage />} />
                  <Route path="/:tokenId/discussions" element={<DiscussionPage />} />
                  <Route path="/about" element={<AboutPage />} />
                </Routes>
              </Suspense>
            </div>
            <BackToTopButton />
            <PerformanceMonitor />
          </div>
        </Router>
      </ErrorBoundary>
    </NotificationProvider>
  );
}


export default App