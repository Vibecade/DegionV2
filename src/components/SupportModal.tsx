import React, { useState } from 'react';
import { X, Heart, ExternalLink, Copy } from 'lucide-react';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupportModal = ({ isOpen, onClose }: SupportModalProps) => {
  const [copySuccess, setCopySuccess] = useState(false);
  
  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText('0x62f1f6bfe3a798d5023608ac0a9c8a9538276283');
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg scale-in-center">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-black/80 to-black/60 border border-[#00ffee]/20 backdrop-blur-xl shadow-[0_0_50px_rgba(0,255,238,0.15)]">
          {/* Header */}
          <div className="relative p-6 pb-4">
            <div className="absolute inset-0 bg-gradient-to-b from-[#00ffee]/10 to-transparent pointer-events-none" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Heart className="w-6 h-6 text-[#00ffee] animate-pulse" />
                <h2 className="text-2xl font-bold bg-gradient-to-r from-[#00ffee] to-[#37fffc] bg-clip-text text-transparent font-orbitron">
                  Support Degion.xyz
                </h2>
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-1 text-gray-400 hover:text-white transition-colors hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Content */}
          <div className="p-6 pt-2 space-y-6">
            <p className="text-[#cfd0d1] leading-relaxed">
              Help us maintain and improve Degion.xyz by supporting our project. Your contribution helps us continue providing accurate and up-to-date information about Legion ICOs.
            </p>
            
            <div className="space-y-4">
              {/* EVM Wallet */}
              <div className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-black/60 to-black/40 border border-[#00ffee]/20 p-4 transition-all duration-300 hover:border-[#00ffee]/40 hover:shadow-[0_0_30px_rgba(0,255,238,0.1)]">
                <div className="absolute inset-0 bg-gradient-to-r from-[#00ffee]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <h3 className="text-lg font-semibold text-[#00ffee] mb-3 font-orbitron">EVM Compatible Chains</h3>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value="0x62f1f6bfe3a798d5023608ac0a9c8a9538276283"
                    readOnly
                    className="w-full bg-black/20 rounded-lg px-3 py-2 text-sm font-mono text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#00ffee]/30"
                  />
                  <button
                    onClick={handleCopy}
                    className="absolute right-2 px-2 py-1 text-xs flex items-center gap-1 text-[#00ffee] hover:text-[#37fffc] transition-colors"
                  >
                    {copySuccess ? 'Copied!' : (
                      <>
                        <Copy className="w-3 h-3" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="flex items-center justify-between p-6 bg-gradient-to-t from-[#00ffee]/5 to-transparent">
            <a 
              href="https://x.com/dustybeerbong"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-[#00ffee] hover:text-[#37fffc] transition-colors group"
            >
              <span>Follow us on X</span>
              <ExternalLink className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform" />
            </a>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#00ffee] to-[#37fffc] text-black font-medium hover:shadow-[0_0_20px_rgba(0,255,238,0.3)] transition-all duration-300 active:scale-95"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};