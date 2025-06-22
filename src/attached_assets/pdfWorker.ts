// Configure PDF.js worker
import * as pdfjsLib from 'pdfjs-dist';

// Configure the worker to use local file
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.ts';

// Enhanced worker initialization with error handling
let workerInitialized = false;

const initializeWorker = () => {
  if (workerInitialized) return;
  
  try {
    // Verify worker source is set
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.ts';
    }
    workerInitialized = true;
    console.log('PDF.js worker initialized with source:', pdfjsLib.GlobalWorkerOptions.workerSrc);
  } catch (error) {
    console.error('PDF.js worker setup error:', error);
    workerInitialized = true; // Mark as initialized even if failed
  }
};

// Initialize worker on module load
if (typeof window !== 'undefined') {
  initializeWorker();
}

export { pdfjsLib, initializeWorker };