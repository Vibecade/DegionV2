import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { TronGrid } from './components/TronGrid';
import { HomePage } from './pages/HomePage';
import { TokenPage } from './pages/TokenPage';
import { DiscussionPage } from './pages/DiscussionPage';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#09131b] text-[#cfd0d1] font-['Orbitron'] relative overflow-x-hidden">
        <TronGrid />
        <div className="relative z-10">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/:tokenId" element={<TokenPage />} />
            <Route path="/:tokenId/discussions" element={<DiscussionPage />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App