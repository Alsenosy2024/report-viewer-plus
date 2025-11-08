// @ts-nocheck
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { fileURLToPath } from "url";
import { componentTagger } from "lovable-tagger";

// @ts-ignore - __dirname equivalent for ES modules
const __dirname = typeof __dirname !== 'undefined' 
  ? __dirname 
  : path.dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // Set root directory to report-viewer-plus where the actual source code is
  root: 'report-viewer-plus',
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "./report-viewer-plus/src"),
    },
  },
  build: {
    // Output to dist in the root directory for easier deployment
    outDir: path.resolve(process.cwd(), 'dist'),
  },
}));
