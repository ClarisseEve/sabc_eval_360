import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Exercise the production-safe fallback instead of inheriting a developer URL.
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify(''),
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    clearMocks: true,
    restoreMocks: true,
    unstubGlobals: true,
  },
});
