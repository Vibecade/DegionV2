import React from 'react';
import { Link } from 'react-router-dom';
import { SEOHead } from '../components/SEOHead';
import { Footer } from '../components/Footer';
import { ArrowLeft, Target, TrendingUp, Users, Shield, Database, Zap } from 'lucide-react';

export const AboutPage = () => {
  return (
    <div className="min-h-screen bg-[#09131b] text-[#cfd0d1] p-4 sm:p-8">
      <SEOHead 
        title="About Degion.xyz - Legion ICO Performance Tracker"
        description="Learn about Degion.xyz, the comprehensive platform for tracking Legion ICO token performance, real-time prices, ROI calculations, and community sentiment analysis."
        keywords="about degion, legion ico tracker, cryptocurrency analytics, token performance, defi tracking"
        canonicalUrl="https://degion.xyz/about"
      />
      
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link 
            to="/"
            className="inline-flex items-center text-[#00ffee] hover:text-[#37fffc] transition-colors group mb-6"
            aria-label="Return to home page"
          >
            <ArrowLeft className="w-5 h-5 mr-2 transform group-hover:-translate-x-1 transition-transform" />
            <span>Back to Home</span>
          </Link>
          
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl font-bold text-[#00ffee] title-glow mb-4 font-orbitron">
              About Degion.xyz
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Your comprehensive platform for tracking Legion ICO token performance and community sentiment
            </p>
          </div>
        </div>

        {/* Mission Section */}
        <div className="glass-panel p-8 rounded-lg mb-8">
          <div className="flex items-center mb-6">
            <Target className="w-8 h-8 text-[#00ffee] mr-4" />
            <h2 className="text-2xl font-bold text-[#00ffee] font-orbitron">Our Mission</h2>
          </div>
          <p className="text-gray-300 leading-relaxed text-lg">
            Degion.xyz was created to provide transparency and comprehensive analytics for Legion ICO participants. 
            We believe that investors deserve access to real-time data, historical performance metrics, and community 
            insights to make informed decisions about their cryptocurrency investments.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="glass-panel p-6 rounded-lg hover-card">
            <div className="flex items-center mb-4">
              <TrendingUp className="w-6 h-6 text-[#00ffee] mr-3" />
              <h3 className="text-xl font-semibold text-[#00ffee] font-orbitron">Real-Time Tracking</h3>
            </div>
            <p className="text-gray-300 leading-relaxed">
              Monitor live token prices, ROI calculations, and investment performance for all Legion ICO tokens. 
              Our data updates every 30 seconds to ensure you have the most current information.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-lg hover-card">
            <div className="flex items-center mb-4">
              <Users className="w-6 h-6 text-[#00ffee] mr-3" />
              <h3 className="text-xl font-semibold text-[#00ffee] font-orbitron">Community Sentiment</h3>
            </div>
            <p className="text-gray-300 leading-relaxed">
              Participate in community discussions and sentiment voting. Share insights, analysis, and opinions 
              with fellow investors to build a comprehensive view of each token's prospects.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-lg hover-card">
            <div className="flex items-center mb-4">
              <Database className="w-6 h-6 text-[#00ffee] mr-3" />
              <h3 className="text-xl font-semibold text-[#00ffee] font-orbitron">Comprehensive Data</h3>
            </div>
            <p className="text-gray-300 leading-relaxed">
              Access detailed information including vesting schedules, sale data, participant counts, 
              and funds raised. All data is sourced from reliable APIs and blockchain analytics.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-lg hover-card">
            <div className="flex items-center mb-4">
              <Shield className="w-6 h-6 text-[#00ffee] mr-3" />
              <h3 className="text-xl font-semibold text-[#00ffee] font-orbitron">Privacy & Security</h3>
            </div>
            <p className="text-gray-300 leading-relaxed">
              Your privacy is protected with IP hashing for voting and discussions. We implement 
              rate limiting and security best practices to ensure a safe browsing experience.
            </p>
          </div>
        </div>

        {/* Technology Section */}
        <div className="glass-panel p-8 rounded-lg mb-8">
          <div className="flex items-center mb-6">
            <Zap className="w-8 h-8 text-[#00ffee] mr-4" />
            <h2 className="text-2xl font-bold text-[#00ffee] font-orbitron">Technology Stack</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-lg font-semibold text-gray-200 mb-3">Frontend</h4>
              <ul className="space-y-2 text-gray-300">
                <li>• React with TypeScript for type safety</li>
                <li>• Tailwind CSS for modern styling</li>
                <li>• Vite for fast development and building</li>
                <li>• TradingView widgets for price charts</li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-200 mb-3">Backend & Data</h4>
              <ul className="space-y-2 text-gray-300">
                <li>• Supabase for database and real-time features</li>
                <li>• CoinGecko API for live price data</li>
                <li>• Legion API for ICO information</li>
                <li>• Dune Analytics for on-chain data</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="glass-panel p-6 rounded-lg mb-8 border-l-4 border-yellow-500">
          <h3 className="text-lg font-semibold text-yellow-400 mb-3 font-orbitron">Important Disclaimer</h3>
          <p className="text-gray-300 leading-relaxed">
            Degion.xyz is an independent platform and is not affiliated with Legion or any of the tracked projects. 
            We provide informational content only and do not offer financial or investment advice. All investment 
            decisions should be based on your own research and risk tolerance. Cryptocurrency investments carry 
            significant risk and you may lose your entire investment.
          </p>
        </div>

        {/* Contact Section */}
        <div className="glass-panel p-8 rounded-lg mb-8 text-center">
          <h2 className="text-2xl font-bold text-[#00ffee] mb-4 font-orbitron">Get in Touch</h2>
          <p className="text-gray-300 mb-6">
            Have questions, suggestions, or want to contribute? We'd love to hear from you.
          </p>
          <div className="flex justify-center space-x-6">
            <a 
              href="https://x.com/dustybeerbong" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-[#00ffee] hover:text-[#37fffc] transition-colors group"
            >
              <span>Follow us on X</span>
              <svg className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
};