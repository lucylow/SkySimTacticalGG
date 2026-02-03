import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import tsconfigPaths from 'vite-tsconfig-paths';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const PORT = Number(process.env.PORT) || 5173;
  const isLovable = process.env.LOVABLE === 'true' || process.env.LOVABLE === '1';

  return {
    server: {
      host: true,
      port: PORT,
      // Allow Vite to fall back to an available port in managed environments
      strictPort: false,
    },
    preview: {
      host: true,
      port: PORT,
    },
    plugins: [
      react(),
      tsconfigPaths(),
      // Ensure Lovable editor can tag components even if env mode differs
      (mode === "development" || isLovable) && componentTagger()
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      sourcemap: true
    }
  };
});
