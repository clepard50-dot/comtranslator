import * as pdfjsLib from 'pdfjs-dist';

// In the ES module build (pdf.mjs), pdfjsLib is the module namespace.
// We need to configure the worker.
// Note: We use the same version in the worker src as in the import map.
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://esm.sh/pdfjs-dist@4.0.379/build/pdf.worker.min.mjs';

export const convertPdfToImages = async (file: File): Promise<string[]> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    // Loading the PDF document
    // We use the spread or direct access depending on how the module is structured,
    // but with import * as pdfjsLib from '.../pdf.mjs', pdfjsLib.getDocument is correct.
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const doc = await loadingTask.promise;
    
    const images: string[] = [];
    const totalPages = doc.numPages;

    // Increased limit to support larger files/longer chapters
    // 60 pages covers most weekly manga chapters + some extras
    const pagesToLoad = Math.min(totalPages, 60);

    for (let i = 1; i <= pagesToLoad; i++) {
      const page = await doc.getPage(i);
      
      const viewport = page.getViewport({ scale: 1.5 }); // 1.5 scale for good quality reading
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      if (!context) continue;

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      await page.render(renderContext).promise;
      
      // Convert to JPEG to save some memory compared to PNG
      images.push(canvas.toDataURL('image/jpeg', 0.85));
    }

    return images;
  } catch (error) {
    console.error("PDF Processing Error:", error);
    throw new Error("Failed to process PDF. Please check if the file is valid.");
  }
};