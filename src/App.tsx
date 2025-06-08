import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { TronGrid } from './components/TronGrid';
import { SEOHead } from './components/SEOHead';
import { HomePage } from './pages/HomePage';
import { TokenPage } from './pages/TokenPage';
import { DiscussionPage } from './pages/DiscussionPage';
import { AboutPage } from './pages/AboutPage';
import { ErrorBoundary } from './components/ErrorBoundary';
import { BackToTopButton } from './components/BackToTopButton';
import { useEffect } from 'react';
import { secureStorage } from './utils/security';
import { memoryMonitor } from './utils/performance';

function App() {
  useEffect(() => {
    try {
      // Clear expired cache items on app start
      secureStorage.clearExpired();
      
      // Log initial memory usage in development
      if (import.meta.env.DEV) {
        memoryMonitor.logMemoryUsage('App Start');
      }
    } catch (error) {
      console.error('Error in App initialization:', error);
    }
  }, []);

  return (
    <ErrorBoundary>
      <Router>
        <SEOHead />
        <div className="min-h-screen bg-cyber-bg text-cyber-text font-['Orbitron'] relative overflow-x-hidden">
          <TronGrid />
          <div className="relative z-10">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/:tokenId" element={<TokenPage />} />
              <Route path="/:tokenId/discussions" element={<DiscussionPage />} />
              <Route path="/about" element={<AboutPage />} />
            </Routes>
          </div>
          <BackToTopButton />
        </div>
      </Router>
    </ErrorBoundary>
  );
}


export default App