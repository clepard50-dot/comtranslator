import React from 'react';
import { SUPPORTED_LANGUAGES } from '../constants';

interface LanguageSelectorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  includeAuto?: boolean;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ 
  label, 
  value, 
  onChange, 
  includeAuto = false 
}) => {
  return (
    <div className="flex flex-col space-y-1">
      <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="block w-full pl-3 pr-10 py-2.5 text-base bg-comic-card border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 sm:text-sm rounded-lg appearance-none cursor-pointer hover:border-gray-600 transition-colors"
        >
          {includeAuto && <option value="auto">✨ Auto Detect</option>}
          {SUPPORTED_LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.name}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default LanguageSelector;
