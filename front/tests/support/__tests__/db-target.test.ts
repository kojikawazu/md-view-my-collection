import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  assertLocalDatabaseTarget,
  hasTestDatabaseUrlOverride,
  resolveTestDatabaseUrl,
} from '../db-target';

/** Testcontainers が払い出す形の接続 URI（ホストの 127.0.0.1 にポートを公開する）。 */
const CONTAINER_URL = 'postgresql://test:test@127.0.0.1:54321/test';

/** 本番 Supabase を模した接続先。ガードが必ず拒否しなければならない。 */
const PRODUCTION_URL = 'postgresql://postgres:secret@db.abcdefgh.supabase.co:5432/postgres';

describe('db-target', () => {
  // 各テストが process.env を書き換えるため、毎回もとに戻す（テスト間の汚染防止）。
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.TEST_DATABASE_URL;
    delete process.env.DATABASE_URL;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe('assertLocalDatabaseTarget（正常系）', () => {
    it.each([
      ['localhost', 'postgresql://u:p@localhost:5432/db'],
      ['127.0.0.1', CONTAINER_URL],
      ['::1', 'postgresql://u:p@[::1]:5432/db'],
    ])('%s を許可し、渡された URL をそのまま返す', (_host, url) => {
      expect(assertLocalDatabaseTarget(url, 'testcontainers')).toBe(url);
    });
  });

  describe('assertLocalDatabaseTarget（異常系）', () => {
    it('リモートホストを拒否する', () => {
      expect(() => assertLocalDatabaseTarget(PRODUCTION_URL, 'TEST_DATABASE_URL')).toThrow(
        /ローカルではありません/,
      );
    });

    it('拒否時のメッセージに接続先ホストを含める（どこへ繋ごうとしたか分からないと原因を追えない）', () => {
      expect(() => assertLocalDatabaseTarget(PRODUCTION_URL, 'TEST_DATABASE_URL')).toThrow(
        /host=db\.abcdefgh\.supabase\.co/,
      );
    });

    it('拒否時のメッセージに復旧手順を含める（無いと回避策として接続先を書き換えられる）', () => {
      expect(() => assertLocalDatabaseTarget(PRODUCTION_URL, 'TEST_DATABASE_URL')).toThrow(
        /pnpm test:integration/,
      );
    });

    it('拒否時のメッセージに出どころを含める', () => {
      expect(() => assertLocalDatabaseTarget(PRODUCTION_URL, 'TEST_DATABASE_URL')).toThrow(
        /TEST_DATABASE_URL/,
      );
    });

    it('ホスト名にローカル名が含まれるだけの偽装ホストを拒否する', () => {
      expect(() =>
        assertLocalDatabaseTarget(
          'postgresql://u:p@localhost.evil.example.com:5432/db',
          'testcontainers',
        ),
      ).toThrow(/ローカルではありません/);
    });

    it('URL として解釈できない値を拒否する', () => {
      expect(() => assertLocalDatabaseTarget('not-a-url', 'testcontainers')).toThrow(
        /URL として解釈できません/,
      );
    });

    it('空文字を拒否する', () => {
      expect(() => assertLocalDatabaseTarget('', 'testcontainers')).toThrow(
        /URL として解釈できません/,
      );
    });
  });

  describe('resolveTestDatabaseUrl（正常系）', () => {
    it('上書きが無ければコンテナの URI を使う', () => {
      expect(resolveTestDatabaseUrl(CONTAINER_URL)).toBe(CONTAINER_URL);
    });

    it('TEST_DATABASE_URL があればコンテナの URI より優先する', () => {
      const override = 'postgresql://u:p@localhost:5432/mine';
      process.env.TEST_DATABASE_URL = override;

      expect(resolveTestDatabaseUrl(CONTAINER_URL)).toBe(override);
    });
  });

  describe('resolveTestDatabaseUrl（準正常系）', () => {
    it('TEST_DATABASE_URL が空文字ならコンテナの URI にフォールバックする', () => {
      process.env.TEST_DATABASE_URL = '';

      expect(resolveTestDatabaseUrl(CONTAINER_URL)).toBe(CONTAINER_URL);
    });

    it('TEST_DATABASE_URL が空白のみならコンテナの URI にフォールバックする', () => {
      process.env.TEST_DATABASE_URL = '   ';

      expect(resolveTestDatabaseUrl(CONTAINER_URL)).toBe(CONTAINER_URL);
    });

    it('接続先を 1 つも特定できない場合は throw する（黙って既定値へ倒れない）', () => {
      expect(() => resolveTestDatabaseUrl()).toThrow(/接続先を特定できません/);
    });
  });

  describe('resolveTestDatabaseUrl（異常系 / 事故の回帰テスト）', () => {
    // 姉妹プロジェクトの本番データ全削除は `process.env.DATABASE_URL ?? ローカル既定` が原因だった。
    // このガードが DATABASE_URL を一切見ないことを、明示的に固定する。
    it('DATABASE_URL に本番 URL が入っていても、それを接続先に採用しない', () => {
      process.env.DATABASE_URL = PRODUCTION_URL;

      expect(resolveTestDatabaseUrl(CONTAINER_URL)).toBe(CONTAINER_URL);
    });

    it('DATABASE_URL に本番 URL が入っていて他に候補が無い場合、フォールバックせず throw する', () => {
      process.env.DATABASE_URL = PRODUCTION_URL;

      expect(() => resolveTestDatabaseUrl()).toThrow(/接続先を特定できません/);
    });

    it('TEST_DATABASE_URL がリモートを指していれば throw する（テスト専用変数でも検証は免除しない）', () => {
      process.env.TEST_DATABASE_URL = PRODUCTION_URL;

      expect(() => resolveTestDatabaseUrl(CONTAINER_URL)).toThrow(/ローカルではありません/);
    });
  });

  describe('hasTestDatabaseUrlOverride', () => {
    it('未設定なら false', () => {
      expect(hasTestDatabaseUrlOverride()).toBe(false);
    });

    it('空白のみなら false（コンテナ起動をスキップさせない）', () => {
      process.env.TEST_DATABASE_URL = '   ';

      expect(hasTestDatabaseUrlOverride()).toBe(false);
    });

    it('値があれば true', () => {
      process.env.TEST_DATABASE_URL = CONTAINER_URL;

      expect(hasTestDatabaseUrlOverride()).toBe(true);
    });
  });
});
