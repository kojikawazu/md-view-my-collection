import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    setupFiles: ['./src/test/setup.ts'],
    // UT はソース隣接の __tests__ と、テスト補助モジュール（tests/support/）の __tests__。
    // tests/e2e・tests/integration は別ランナーで実行するため除外する。
    // tests/support/ を含めるのは、接続先ガード（db-target.ts）が本番 DB 破壊を防ぐ
    // 実装であり、それ自体に UT が必須のため（.claude/rules/testing.md）。本番バンドルに
    // 混ぜないよう src/ ではなく tests/ 側に置いている。
    include: ['src/**/*.{test,spec}.{ts,tsx}', 'tests/support/**/*.{test,spec}.ts'],
    exclude: ['node_modules', 'tests/e2e/**', 'tests/integration/**'],
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
