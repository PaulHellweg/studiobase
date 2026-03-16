import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    css: true,
    exclude: ['**/node_modules/**', '**/dist/**', 'e2e/**'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@studiobase/server/trpc': path.resolve(__dirname, '../server/src/trpc/index.ts'),
      '@studiobase/shared/schema': path.resolve(__dirname, '../shared/src/schema.ts'),
      '@studiobase/shared/validation': path.resolve(__dirname, '../shared/src/validation.ts'),
      '@studiobase/shared': path.resolve(__dirname, '../shared/src/index.ts'),
    },
  },
});
