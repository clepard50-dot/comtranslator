import React, { useState, useCallback, useEffect, useRef } from 'react';
import Header from './components/Header';
import UploadArea from './components/UploadArea';
import LanguageSelector from './components/LanguageSelector';
import Button from './components/Button';
import PageCard from './components/PageCard'; 
import { AppStatus, PageData, ViewMode } from './types';
import { DEFAULT_SOURCE_LANG, DEFAULT_TARGET_LANG } from './constants';
import { translateComicPage } from './services/geminiService';
import { convertPdfToImages } from './services/pdfService';

const App: React.FC = () => {
  const [sourceLang, setSourceLang] = useState(DEFAULT_SOURCE_LANG);
  const [targetLang, setTargetLang] = useState(DEFAULT_TARGET_LANG);
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [globalViewMode, setGlobalViewMode] = useState<ViewMode>('split');
  const [userApiKey, setUserApiKey] = useState<string>('');
  
  const pagesContainerRef = useRef<HTMLDivElement>(null);

  // Load API Key from storage
  useEffect(() => {
    const storedKey = localStorage.getItem('gemini_api_key');
    if (storedKey) {
      setUserApiKey(storedKey);
    }
  }, []);

  const handleApiKeyChange = (key: string) => {
    setUserApiKey(key);
    localStorage.setItem('gemini_api_key', key);
  };

  // --- Queue Processor ---
  useEffect(() => {
    if (!isTranslating) return;

    // Concurrency limit: 1. Ensure we don't process if something is already going.
    const isAnyProcessing = pages.some(p => p.status === AppStatus.PROCESSING);
    if (isAnyProcessing) return;

    const processNextPage = async () => {
      // Find the first queued page
      const pageIndex = pages.findIndex(p => p.status === AppStatus.QUEUED);
      
      if (pageIndex === -1) {
        setIsTranslating(false);
        return;
      }

      // Mark as PROCESSING
      setPages(prev => {
        const next = [...prev];
        next[pageIndex] = { ...next[pageIndex], status: AppStatus.PROCESSING };
        return next;
      });

      const page = pages[pageIndex];

      try {
        const bubbles = await translateComicPage(
          page.originalImage, 
          sourceLang, 
          targetLang,
          userApiKey
        );

        setPages(prev => {
          const next = [...prev];
          next[pageIndex] = { 
            ...next[pageIndex], 
            bubbles: bubbles,
            status: AppStatus.COMPLETED 
          };
          return next;
        });

      } catch (err: any) {
        console.error(`Error translating page ${pageIndex + 1}`, err);
        setPages(prev => {
          const next = [...prev];
          next[pageIndex] = { ...next[pageIndex], status: AppStatus.ERROR };
          return next;
        });
        
        // Parse and display user-friendly error messages
        let errorMessage = "Translation failed. Please try again.";
        
        if (err.message) {
          if (err.message.includes("API key expired") || err.message.includes("API_KEY_INVALID")) {
            errorMessage = "API key is invalid or expired. Please set a valid API key.";
          } else if (err.message.includes("leaked")) {
            errorMessage = "API key was flagged as leaked. Please generate a new API key.";
          } else if (err.message.includes("quota") || err.message.includes("RESOURCE_EXHAUSTED")) {
            errorMessage = "API quota exceeded. Please try again later or use a different API key.";
          } else if (err.message.includes("API Key")) {
            errorMessage = err.message;
          } else if (err.message.includes("403") || err.message.includes("PERMISSION_DENIED")) {
            errorMessage = "Permission denied. Your API key may be invalid or restricted.";
          } else {
            errorMessage = `Error: ${err.message}`;
          }
        }
        
        setError(errorMessage);
        setIsTranslating(false);
      }
    };

    processNextPage();

  }, [pages, isTranslating, sourceLang, targetLang, userApiKey]);


  const handleFileSelect = useCallback(async (selectedFiles: File[]) => {
    setFile(selectedFiles[0]); // Keep first file for display purposes
    setError(null);
    setPages([]);
    setIsTranslating(false);

    try {
      let extractedImages: string[] = [];

      for (const selectedFile of selectedFiles) {
        if (selectedFile.type === 'application/pdf') {
          const pdfImages = await convertPdfToImages(selectedFile);
          extractedImages.push(...pdfImages);
        } else {
          const reader = new FileReader();
          const imagePromise = new Promise<string>((resolve) => {
            reader.onload = (e) => resolve(e.target?.result as string);
          });
          reader.readAsDataURL(selectedFile);
          extractedImages.push(await imagePromise);
        }
      }

      const newPages: PageData[] = extractedImages.map((img, idx) => ({
        id: `page-${idx}`,
        originalImage: img,
        bubbles: null,
        status: AppStatus.IDLE
      }));

      setPages(newPages);

    } catch (err: any) {
      console.error(err);
      setError("Failed to load file(s). If it's a PDF, ensure it is not password protected or corrupted.");
      setFile(null);
    }
  }, []);

  // Manual Trigger for "Translate All"
  const startTranslation = () => {
    if (pages.length === 0) return;
    
    // Check if key exists (either user or env)
    if (!userApiKey && !process.env.API_KEY) {
        setError("Please set your Gemini API Key in the top right corner before translating.");
        return;
    }
    setError(null);

    setPages(prev => prev.map(p => ({
      ...p,
      status: (p.status === AppStatus.IDLE || p.status === AppStatus.ERROR) ? AppStatus.QUEUED : p.status
    })));
    
    setIsTranslating(true);
  };

  // Triggered by IntersectionObserver or Manual Button
  const queuePage = useCallback((index: number) => {
    if (!userApiKey && !process.env.API_KEY) {
        setError("Please set your Gemini API Key in the top right corner.");
        return;
    }
    setError(null);
    
    setPages(prev => {
      // Only queue if it's IDLE or ERROR (don't mess with Processing/Completed)
      if (prev[index].status === AppStatus.IDLE || prev[index].status === AppStatus.ERROR) {
        const next = [...prev];
        next[index] = { ...next[index], status: AppStatus.QUEUED };
        return next;
      }
      return prev;
    });
    setIsTranslating(true);
  }, [userApiKey]);

  const handleReset = () => {
    setFile(null);
    setPages([]);
    setIsTranslating(false);
    setError(null);
  };

  const completedCount = pages.filter(p => p.status === AppStatus.COMPLETED).length;
  const totalCount = pages.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="min-h-screen bg-comic-bg text-gray-100 font-sans selection:bg-brand-500 selection:text-white">
      <Header onApiKeyChange={handleApiKeyChange} hasKey={!!userApiKey || !!process.env.API_KEY} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {!file && (
          <div className="text-center mb-12 animate-fade-in-up">
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
              Translate Comics <span className="text-brand-500">Instantly</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Upload manga, manhua, or western comics (Images or PDF). Our AI detects speech bubbles and overlays translated text directly in your browser.
            </p>
          </div>
        )}

        {!file ? (
          // Initial State: Centered Upload Area
          <div className="max-w-3xl mx-auto animate-fade-in-up">
             <UploadArea onFileSelect={handleFileSelect} />
          </div>
        ) : (
          // Loaded State: Sidebar + Continuous Scroll Layout
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Sidebar Controls */}
            <div className="lg:col-span-3 space-y-6">
                <div className="bg-comic-card p-4 rounded-xl border border-gray-700 shadow-xl sticky top-24">
                   <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-white">Source File</h3>
                      <button onClick={handleReset} className="text-xs text-red-400 hover:text-red-300">Remove</button>
                   </div>
             <div className="flex items-center space-x-3 mb-6 bg-gray-900/50 p-2 rounded border border-gray-800">
               <div className="h-10 w-10 bg-brand-900 text-brand-400 rounded flex items-center justify-center shrink-0">
                {file && file.type === 'application/pdf' ? 'PDF' : 'IMG'}
               </div>
               <div className="overflow-hidden">
                 <p className="text-xs truncate text-gray-300 font-medium" title={file ? file.name : ''}>
                  {file && pages.length <= 1 ? file.name : `${pages.length} Page${pages.length !== 1 ? 's' : ''}`}
                 </p>
                 <p className="text-[10px] text-gray-500">{pages.length} Page{pages.length !== 1 ? 's' : ''}</p>
               </div>
             </div>

                   <div className="space-y-4 mb-6">
                      <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Configuration</h4>
                      <LanguageSelector 
                        label="Source" 
                        value={sourceLang} 
                        onChange={setSourceLang} 
                        includeAuto 
                      />
                      <div className="flex justify-center -my-3 relative z-10">
                         <div className="bg-gray-800 rounded-full p-0.5 border border-gray-600">
                            <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>
                         </div>
                      </div>
                      <LanguageSelector 
                        label="Target" 
                        value={targetLang} 
                        onChange={setTargetLang} 
                      />

                      <div className="pt-2">
                          <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Global View</h4>
                          <div className="grid grid-cols-3 gap-1 bg-gray-800 p-1 rounded-lg border border-gray-700">
                              {(['original', 'split', 'translated'] as ViewMode[]).map((mode) => (
                              <button
                                  key={mode}
                                  onClick={() => setGlobalViewMode(mode)}
                                  className={`
                                      px-2 py-1.5 text-[10px] md:text-xs font-medium rounded-md capitalize transition-all text-center
                                      ${globalViewMode === mode 
                                      ? 'bg-brand-600 text-white shadow-sm' 
                                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                                      }
                                  `}
                              >
                                  {mode}
                              </button>
                              ))}
                          </div>
                      </div>
                   </div>

                   <div className="space-y-3">
                     <Button 
                      onClick={startTranslation}
                      disabled={isTranslating && pages.every(p => p.status === AppStatus.QUEUED || p.status === AppStatus.PROCESSING || p.status === AppStatus.COMPLETED)}
                      isLoading={isTranslating}
                      className="w-full py-2.5 shadow-lg shadow-brand-900/20"
                      icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"></path></svg>}
                    >
                      {isTranslating ? `Translating...` : 'Translate All Pages'}
                    </Button>
                    
                    {isTranslating && (
                      <div className="w-full bg-gray-800 rounded-full h-2 mt-2">
                        <div className="bg-brand-500 h-2 rounded-full transition-all duration-300" style={{ width: `${progressPercent}%` }}></div>
                      </div>
                    )}
                   </div>

                   {error && (
                    <div className="mt-4 p-3 bg-red-900/30 border border-red-800 rounded text-xs text-red-200">
                      {error}
                    </div>
                  )}
                </div>
            </div>

            {/* Continuous Vertical Reader */}
            <div 
              ref={pagesContainerRef}
              className="lg:col-span-9 flex flex-col w-full bg-black/20"
            >
              {/* Thumbnail strip for quick navigation (minimal implementation) */}
              {pages.length > 1 && (
                <div className="w-full overflow-x-auto py-3 px-4 bg-gray-900/40 border-b border-gray-800">
                  <div className="flex space-x-3 items-center">
                    {pages.map((p, i) => (
                      <button
                        key={`thumb-${p.id}-${i}`}
                        onClick={() => {
                          const el = document.getElementById(`page-${i}`);
                          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }}
                        className="flex-shrink-0 rounded overflow-hidden border border-gray-800 hover:scale-105 transition-transform"
                        style={{ width: 100, height: 140 }}
                        title={`Page ${i + 1}`}
                      >
                        <img src={p.originalImage} alt={`Page ${i + 1}`} className="w-full h-full object-cover block" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {pages.map((page, index) => (
                <PageCard 
                  key={page.id} 
                  page={page} 
                  index={index} 
                  onQueue={queuePage} 
                  globalViewMode={globalViewMode}
                />
              ))}
              
              {pages.length > 0 && (
                  <div className="text-center text-gray-500 text-sm py-8">
                    End of document
                  </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;