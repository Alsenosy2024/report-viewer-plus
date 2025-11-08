import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
<<<<<<< HEAD
import ErrorBoundary from './ErrorBoundary'

// Add inline styles as fallback in case CSS doesn't load
const fallbackStyles = document.createElement('style');
fallbackStyles.textContent = `
  body { margin: 0; font-family: system-ui, -apple-system, sans-serif; }
  #root { min-height: 100vh; }
`;
document.head.appendChild(fallbackStyles);

const rootElement = document.getElementById("root");

if (!rootElement) {
  // Show error even if root element doesn't exist
  document.body.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: system-ui;">
      <div style="text-align: center; padding: 2rem;">
        <h1 style="color: #dc2626; margin-bottom: 1rem;">Root element not found</h1>
        <p style="color: #6b7280;">The application cannot start. Please check the HTML structure.</p>
      </div>
    </div>
  `;
  throw new Error('Root element not found');
}

try {
  createRoot(rootElement).render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
} catch (error) {
  console.error('Failed to render app:', error);
  rootElement.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: system-ui; padding: 2rem;">
      <div style="text-align: center; max-width: 500px;">
        <h1 style="color: #dc2626; margin-bottom: 1rem;">Failed to load application</h1>
        <p style="color: #6b7280; margin-bottom: 1.5rem;">${error instanceof Error ? error.message : 'Unknown error'}</p>
        <button onclick="window.location.reload()" style="padding: 0.5rem 1rem; background-color: #3b82f6; color: white; border: none; border-radius: 0.375rem; cursor: pointer;">
          Refresh Page
        </button>
      </div>
    </div>
  `;
}
=======

createRoot(document.getElementById("root")!).render(<App />);
>>>>>>> d281f306ef1af80a348cdb9074ff2733b0c393c7
