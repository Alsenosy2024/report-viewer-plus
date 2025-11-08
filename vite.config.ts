import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { fileURLToPath } from "url";
import { componentTagger } from "lovable-tagger";

// ES module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// This config builds from report-viewer-plus subdirectory
// The actual frontend code is in report-viewer-plus/
export default defineConfig(({ mode }) => ({
  root: path.resolve(__dirname, './report-viewer-plus'),
  base: '/',
  server: {
    host: "::",
    port: 8080,
  },
  build: {
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true,
    assetsDir: 'assets',
    cssCodeSplit: false,
    sourcemap: false,
    rollupOptions: {
      input: path.resolve(__dirname, './report-viewer-plus/index.html'),
    },
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./report-viewer-plus/src"),
    },
  },
}));

