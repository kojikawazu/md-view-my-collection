import { defineConfig } from 'vitest/config';
import path from 'path';

// 統合テスト（IT）専用の Vitest 設定。
// - Testcontainers で起動した実 Postgres に対して API ルートハンドラを in-process 実行する。
// - node 環境（happy-dom ではない。NextRequest/Response の undici 実装を使うため）。
// - 単一コンテナを直列共有するため fileParallelism を無効化する。
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/integration/**/*.test.ts'],
    globalSetup: ['tests/integration/global-setup.ts'],
    setupFiles: ['tests/integration/setup-env.ts', 'tests/integration/setup-auth-mock.ts'],
    fileParallelism: false,
    pool: 'forks',
    testTimeout: 30_000,
    hookTimeout: 120_000, // コンテナ起動 + イメージ pull を考慮
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // `server-only` は "react-server" 条件でのみ空モジュールに解決され、それ以外では
      // 読み込むだけで throw する。IT は素の node でルートハンドラを直接 import するため、
      // 空実装へ明示的に向けないとスイートが起動しない（本番のガードには影響しない）。
      'server-only': path.resolve(__dirname, './node_modules/server-only/empty.js'),
    },
  },
});
