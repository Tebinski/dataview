import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// base: './' makes the built asset paths relative, so the app works both
// locally and when served from a GitHub Pages project subpath (user.github.io/repo/).
export default defineConfig({
    plugins: [react()],
    base: './',
});
