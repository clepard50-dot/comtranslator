import React, { useState } from 'react';

interface HeaderProps {
  onApiKeyChange?: (key: string) => void;
  hasKey?: boolean;
}

const Header: React.FC<HeaderProps> = ({ onApiKeyChange, hasKey }) => {
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [tempKey, setTempKey] = useState('');

  const handleSave = () => {
    if (onApiKeyChange) {
      onApiKeyChange(tempKey);
    }
    setShowKeyInput(false);
    setTempKey('');
  };

  return (
    <header className="w-full border-b border-gray-800 bg-comic-bg/95 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-br from-brand-500 to-purple-600 p-2 rounded-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 font-comic tracking-wide hidden sm:block">
            Koma<span className="text-brand-500">Translator</span>
          </h1>
        </div>
        
        <div className="flex items-center space-x-4">
          
          {/* API Key Section */}
          <div className="relative">
            <button 
              onClick={() => setShowKeyInput(!showKeyInput)}
              className={`flex items-center space-x-2 text-xs font-medium px-3 py-1.5 rounded transition-colors border ${hasKey ? 'bg-green-900/20 text-green-400 border-green-800/50 hover:bg-green-900/30' : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11.536 19.464a2.768 2.768 0 01-2.121.536 6.792 6.792 0 01-2.829-1.415 6.792 6.792 0 01-1.415-2.829 2.768 2.768 0 01.536-2.121L9.464 11.536A6 6 0 0115 7zm0 0a2 2 0 012 2m-2-2v0m0 0a2 2 0 012 2" />
              </svg>
              <span>{hasKey ? 'API Key Set' : 'Set API Key'}</span>
            </button>

            {showKeyInput && (
              <div className="absolute top-full right-0 mt-2 w-72 bg-comic-card border border-gray-700 rounded-lg shadow-2xl p-4 z-50 animate-fade-in-down">
                <div className="flex flex-col space-y-3">
                  <label className="text-xs text-gray-400 font-medium uppercase">Enter Gemini API Key</label>
                  <input 
                    type="password" 
                    value={tempKey}
                    onChange={(e) => setTempKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
                  />
                  <div className="flex justify-end space-x-2">
                     <button 
                       onClick={() => setShowKeyInput(false)}
                       className="text-xs text-gray-400 hover:text-white px-3 py-1"
                     >
                       Cancel
                     </button>
                     <button 
                       onClick={handleSave}
                       className="text-xs bg-brand-600 hover:bg-brand-500 text-white px-3 py-1.5 rounded"
                     >
                       Save Key
                     </button>
                  </div>
                  <p className="text-[10px] text-gray-500 leading-tight">
                    Your key is stored locally in your browser and used only for requests to Google.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;