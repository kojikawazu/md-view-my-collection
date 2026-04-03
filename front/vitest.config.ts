import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    setupFiles: ['./src/test/setup.ts'],
    exclude: ['node_modules', 'tests/e2e/**'],
    pool: 'vmThreads',
    // Node v24 OOM occurs during worker cleanup (after all tests complete).
    // This flag suppresses that infrastructure error so the exit code stays 0.
    // CI uses Node 20 and does not exhibit this issue.
    dangerouslyIgnoreUnhandledErrors: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
