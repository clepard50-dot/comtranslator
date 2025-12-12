import React, { useEffect, useRef, useState } from 'react';
import { AppStatus, PageData, ViewMode } from '../types';
import ComparisonViewer from './ComparisonViewer';

interface PageCardProps {
  page: PageData;
  index: number;
  onQueue: (index: number) => void;
  globalViewMode: ViewMode;
  onToggleFullScreen?: (index: number) => void; // Kept in interface but unused to prevent build errors if parent passes it, though we should clean parent too.
}

const PageCard: React.FC<PageCardProps> = ({ page, index, onQueue, globalViewMode }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [hasBeenSeen, setHasBeenSeen] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasBeenSeen) {
          setHasBeenSeen(true);
          // Auto-queue if IDLE when it comes into view
          if (page.status === AppStatus.IDLE) {
            onQueue(index);
          }
        }
      },
      { threshold: 0.1 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [index, onQueue, page.status, hasBeenSeen]);

  // Determine if we need a minimal overlay for status (e.g. Error)
  const isError = page.status === AppStatus.ERROR;
  
  return (
    <div 
      ref={cardRef}
      className="w-full relative group bg-black" 
      id={`page-${index}`}
    >
      <ComparisonViewer 
        originalImage={page.originalImage} 
        bubbles={page.bubbles} 
        status={page.status}
        globalViewMode={globalViewMode}
      />

      {/* Minimal Status Overlay - Hidden by default, visible on hover or if Error */}
      {(isError || page.status === AppStatus.IDLE) && (
          <div className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
              {isError && (
                  <button 
                    onClick={() => onQueue(index)}
                    className="bg-red-600/90 text-white text-xs px-2 py-1 rounded shadow hover:bg-red-500"
                  >
                    Retry
                  </button>
              )}
               {page.status === AppStatus.IDLE && (
                  <button 
                    onClick={() => onQueue(index)}
                    className="bg-brand-600/90 text-white text-xs px-2 py-1 rounded shadow hover:bg-brand-500"
                  >
                    Translate
                  </button>
              )}
          </div>
      )}
      
      {/* Processing Indicator - Minimal thin line at top */}
      {page.status === AppStatus.PROCESSING && (
          <div className="absolute top-0 left-0 w-full h-1 bg-brand-900/30 z-20 overflow-hidden">
              <div className="h-full bg-brand-500 animate-progress-indeterminate"></div>
          </div>
      )}
    </div>
  );
};

export default PageCard;