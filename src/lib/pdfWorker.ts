import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.js?url";

// Point PDF.js to the locally built worker file
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

// Optionally, you can export the workerSrc for debugging/logging
// export const workerSrc = pdfWorker;

export { pdfjsLib };
