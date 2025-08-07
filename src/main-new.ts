import { FitFileAnalyzer } from './fit-file-analyzer';

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('Initializing FIT File Analyzer...');
  const analyzer = new FitFileAnalyzer();
  // Keep reference to prevent garbage collection
  (window as any).fitAnalyzer = analyzer;
});
