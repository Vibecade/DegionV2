import React, { useState, useRef, useEffect } from 'react';
import { Search, X, TrendingUp } from 'lucide-react';
import { Token } from '../types';

interface SearchWithSuggestionsProps {
  tokens: Token[];
  searchTerm: string;
  onSearchChange: (term: string) => void;
  placeholder?: string;
}

export const SearchWithSuggestions: React.FC<SearchWithSuggestionsProps> = ({
  tokens,
  searchTerm,
  onSearchChange,
  placeholder = "Search tokens..."
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Filter suggestions based on search term
  const suggestions = tokens.filter(token => 
    token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    token.id.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 5);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex(prev => 
            prev < suggestions.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex(prev => prev > 0 ? prev - 1 : prev);
          break;
        case 'Enter':
          e.preventDefault();
          if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
            handleSuggestionClick(suggestions[highlightedIndex]);
          }
          break;
        case 'Escape':
          setIsOpen(false);
          setHighlightedIndex(-1);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, highlightedIndex, suggestions]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onSearchChange(value);
    setIsOpen(value.length > 0);
    setHighlightedIndex(-1);
  };

  const handleSuggestionClick = (token: Token) => {
    onSearchChange(token.name);
    setIsOpen(false);
    setHighlightedIndex(-1);
    // Navigate to token page
    window.location.href = `/${token.id}`;
  };

  const clearSearch = () => {
    onSearchChange('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => searchTerm.length > 0 && setIsOpen(true)}
          className="w-full bg-black/30 border border-[rgba(0,255,238,0.2)] rounded-lg pl-10 pr-12 py-3 text-[#cfd0d1] focus:outline-none focus:border-[#00ffee] transition-all duration-300 focus:shadow-[0_0_20px_rgba(0,255,238,0.1)]"
        />
        {searchTerm && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Suggestions dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-2 bg-black/90 backdrop-blur-sm border border-[rgba(0,255,238,0.2)] rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto"
        >
          {suggestions.map((token, index) => (
            <button
              key={token.id}
              onClick={() => handleSuggestionClick(token)}
              className={`w-full text-left px-4 py-3 hover:bg-[rgba(0,255,238,0.1)] transition-colors border-b border-[rgba(0,255,238,0.1)] last:border-0 ${
                index === highlightedIndex ? 'bg-[rgba(0,255,238,0.1)]' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <img
                    src={`https://sadpepedev.github.io/TheLegionProject/images/logos/${token.id.toLowerCase()}.png`}
                    alt={`${token.name} logo`}
                    className="w-8 h-8 rounded-full"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCA1MCA1MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjUiIGN5PSIyNSIgcj0iMjUiIGZpbGw9IiMwMGZmZWUiLz4KPHN2ZyB4PSIxMiIgeT0iMTIiIHdpZHRoPSIyNiIgaGVpZ2h0PSIyNiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMwMDAwMDAiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMyIvPgo8cGF0aCBkPSJtMyA5IDktOSA5IDltLTkgOXY5Ci8+Cjwvc3ZnPgo8L3N2Zz4K';
                    }}
                  />
                  <div>
                    <div className="text-white font-medium">{token.name}</div>
                    <div className="text-gray-400 text-sm">{token.id.toUpperCase()}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`badge badge-${token.status.toLowerCase().replace(' ', '-')} text-xs`}>
                    {token.status}
                  </span>
                  {token.status === 'Live' && (
                    <TrendingUp className="w-4 h-4 text-green-400" />
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};