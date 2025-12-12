import React from 'react';
import { Bubble, ViewMode } from '../types';

interface ComparisonViewerProps {
  originalImage: string;
  bubbles: Bubble[] | null;
  status: string;
  globalViewMode: ViewMode;
}

const OverlayImage: React.FC<{ src: string; bubbles: Bubble[] }> = ({ src, bubbles }) => {
  return (
    <div className="relative w-full h-auto">
      <img src={src} alt="Comic Page" className="w-full h-auto block" />
      {bubbles.map((bubble, idx) => {
        const { ymin, xmin, ymax, xmax } = bubble.coordinates;
        // Convert 1000-based coordinates to percentages
        const top = ymin / 10;
        const left = xmin / 10;
        const height = (ymax - ymin) / 10;
        const width = (xmax - xmin) / 10;

        return (
          <div
            key={idx}
            className="absolute bg-white flex items-center justify-center text-center p-0.5 rounded-sm shadow-sm overflow-hidden z-10"
            style={{
              top: `${top}%`,
              left: `${left}%`,
              height: `${height}%`,
              width: `${width}%`,
            }}
          >
            <p 
              className="text-black font-comic font-medium leading-tight select-none"
              style={{ 
                 // Dynamic font scaling using container queries logic (cqw is relative to width)
                 fontSize: 'clamp(8px, 1.2cqw, 16px)' 
              }}
            >
              {bubble.translatedText}
            </p>
          </div>
        );
      })}
    </div>
  );
};

const ComparisonViewer: React.FC<ComparisonViewerProps> = ({ originalImage, bubbles, status, globalViewMode }) => {
  // Container query support for font scaling
  const containerStyle = { containerType: 'inline-size' } as React.CSSProperties;

  // Render logic based purely on props, no internal state or controls
  
  // Minimal Placeholder for Split View
  const LoadingPlaceholder = () => (
    <div className="w-full h-full min-h-[100px] bg-gray-900 animate-pulse flex items-center justify-center">
       {/* Minimal or no content */}
    </div>
  );

  return (
    <div className="w-full h-full bg-black">
      
      {globalViewMode === 'original' && (
        <div className="w-full flex justify-center">
           <img src={originalImage} alt="Original" className="w-full h-auto block" />
        </div>
      )}

      {globalViewMode === 'translated' && (
         <div className="w-full flex justify-center">
            {bubbles ? (
                <div className="w-full" style={containerStyle}>
                    <OverlayImage src={originalImage} bubbles={bubbles} />
                </div>
            ) : (
                // If waiting for translation in translated-only mode, show original as placeholder
                // or a loading state. Showing original is usually better for reading flow until ready.
                <div className="w-full relative">
                    <img src={originalImage} alt="Original (Pending)" className="w-full h-auto block opacity-80" />
                    {status === 'PROCESSING' && (
                        <div className="absolute inset-0 bg-black/10 animate-pulse" />
                    )}
                </div>
            )}
         </div>
      )}

      {globalViewMode === 'split' && (
        <div className="flex flex-row w-full items-start justify-center">
           <div className="flex-1 w-1/2 min-w-0 border-r border-gray-900">
              <img src={originalImage} alt="Original" className="w-full h-auto block" />
           </div>
           
           <div className="flex-1 w-1/2 min-w-0" style={containerStyle}>
              {bubbles ? (
                  <OverlayImage src={originalImage} bubbles={bubbles} />
              ) : (
                  // For split view right side, if not ready, show a minimal placeholder frame
                  // matching the aspect ratio if possible, or just the image with loading overlay
                  <div className="relative w-full">
                       <img src={originalImage} alt="Loading" className="w-full h-auto block opacity-30 grayscale" />
                       <div className="absolute inset-0 flex items-center justify-center">
                          {status === 'PROCESSING' && (
                              <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                          )}
                       </div>
                  </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
};

export default ComparisonViewer;