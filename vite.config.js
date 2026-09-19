import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // If you deploy this to GitHub Pages under a repo subpath (Phase 4),
  // set base to '/<repo-name>/' here. Netlify/Vercel at a root domain
  // don't need this changed.
  base: '/'
});
