// Global type declarations for SABC Eval360

interface Window {
  __SABC_DEBUG__?: boolean;
}

// Module declarations for packages with non-standard exports fields
declare module 'jspdf' {
  export { jsPDF as default } from '../../../node_modules/jspdf/types/index';
}

declare module 'html2canvas' {
  import html2canvas from '../../../node_modules/html2canvas/dist/types/index';
  export default html2canvas;
}
