import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
    ],
    esbuild: {
        jsx: 'automatic',
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, 'resources/js'),
        },
    },
    build: {
        outDir: 'public/build',
        rollupOptions: {
            input: {
                demo: resolve(__dirname, 'resources/js/demo.tsx'),
            },
        },
    },
    server: {
        open: '/demo.html',
    },
});
