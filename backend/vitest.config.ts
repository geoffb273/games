import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    globalSetup: ['./test/globalSetup.ts'],
  },
  resolve: {
    alias: [
      { find: '@/test', replacement: path.resolve(__dirname, 'test') },
      { find: '@', replacement: path.resolve(__dirname, 'src') },
    ],
  },
});
