import { describe, expect, it } from 'vitest';
import {
  assertPrismaCommandAllowed,
  extractPrismaSubcommand,
  isDestructivePrismaCommand,
} from '../prisma-guard';

/** 本番 Supabase を模した接続先。破壊的コマンドに対しては必ず拒否されなければならない。 */
const PRODUCTION_URL = 'postgresql://postgres:secret@db.abcdefgh.supabase.co:5432/postgres';

/** ローカルの使い捨て DB。破壊的コマンドでも許可される。 */
const LOCAL_URL = 'postgresql://test:test@127.0.0.1:54321/test';

/**
 * Prisma CLI 呼び出しの `process.argv` を組み立てる。
 * 実際の argv は `[node, <prisma bin>, ...args]` の形になる。
 */
const argvFor = (...args: string[]): string[] => [
  '/usr/bin/node',
  '/x/node_modules/.bin/prisma',
  ...args,
];

describe('extractPrismaSubcommand', () => {
  it('2 語のサブコマンドを取り出す', () => {
    expect(extractPrismaSubcommand(argvFor('db', 'push'))).toBe('db push');
  });

  it('1 語のサブコマンドを取り出す', () => {
    expect(extractPrismaSubcommand(argvFor('generate'))).toBe('generate');
  });

  it('最初のフラグ以降は読まない（フラグの値を位置引数と誤認しないため）', () => {
    const argv = argvFor('migrate', 'diff', '--to-schema-datamodel', 'prisma/schema.prisma');

    expect(extractPrismaSubcommand(argv)).toBe('migrate diff');
  });

  it('先頭がフラグなら空文字を返す', () => {
    expect(extractPrismaSubcommand(argvFor('--version'))).toBe('');
  });

  it('サブコマンドが無ければ空文字を返す', () => {
    expect(extractPrismaSubcommand(argvFor())).toBe('');
  });
});

describe('isDestructivePrismaCommand', () => {
  it.each([
    'db push',
    'db execute',
    'db seed',
    'migrate reset',
    'migrate dev',
    'migrate deploy',
    'studio',
  ])('%s を破壊的と判定する', (subcommand) => {
    expect(isDestructivePrismaCommand(subcommand)).toBe(true);
  });

  it.each(['generate', 'db pull', 'migrate diff', 'validate', 'format'])(
    '%s を破壊的と判定しない',
    (subcommand) => {
      expect(isDestructivePrismaCommand(subcommand)).toBe(false);
    },
  );

  it('空文字を破壊的と判定しない', () => {
    expect(isDestructivePrismaCommand('')).toBe(false);
  });

  it('未知のサブコマンドを破壊的と判定しない（過剰に塞ぐとガード自体を外される）', () => {
    expect(isDestructivePrismaCommand('init')).toBe(false);
  });

  it('`db pull` を `db push` と取り違えない', () => {
    expect(isDestructivePrismaCommand('db pull')).toBe(false);
  });
});

describe('assertPrismaCommandAllowed（正常系）', () => {
  it.each([
    ['generate', argvFor('generate')],
    ['db pull', argvFor('db', 'pull')],
    ['migrate diff', argvFor('migrate', 'diff', '--from-empty')],
  ])('%s は本番接続先でも通す（DB を壊さない正当な用途のため）', (_name, argv) => {
    expect(() => assertPrismaCommandAllowed(argv, PRODUCTION_URL)).not.toThrow();
  });

  it('破壊的コマンドでも接続先が localhost なら通す（判定軸はコマンド名ではなく接続先）', () => {
    expect(() => assertPrismaCommandAllowed(argvFor('db', 'push'), LOCAL_URL)).not.toThrow();
  });

  it('破壊的コマンドでも接続先が ::1 なら通す', () => {
    const ipv6 = 'postgresql://u:p@[::1]:5432/db';

    expect(() => assertPrismaCommandAllowed(argvFor('migrate', 'reset'), ipv6)).not.toThrow();
  });
});

describe('assertPrismaCommandAllowed（準正常系）', () => {
  it('接続先が未設定なら何もしない（Prisma 側が解決に失敗するため独自に落とさない）', () => {
    expect(() => assertPrismaCommandAllowed(argvFor('db', 'push'), undefined)).not.toThrow();
  });

  it('サブコマンドが無ければ何もしない', () => {
    expect(() => assertPrismaCommandAllowed(argvFor(), PRODUCTION_URL)).not.toThrow();
  });
});

describe('assertPrismaCommandAllowed（異常系）', () => {
  it.each([
    ['db push', argvFor('db', 'push')],
    ['migrate reset', argvFor('migrate', 'reset')],
    ['migrate deploy', argvFor('migrate', 'deploy')],
    ['studio', argvFor('studio')],
  ])('%s × 本番接続先を拒否する', (_name, argv) => {
    expect(() => assertPrismaCommandAllowed(argv, PRODUCTION_URL)).toThrow(/prisma-guard/);
  });

  it('フラグが混ざっていても判定がずれない', () => {
    const argv = argvFor('db', 'push', '--force-reset', '--accept-data-loss');

    expect(() => assertPrismaCommandAllowed(argv, PRODUCTION_URL)).toThrow(/prisma-guard/);
  });

  it('メッセージに接続先ホストを含める', () => {
    expect(() => assertPrismaCommandAllowed(argvFor('db', 'push'), PRODUCTION_URL)).toThrow(
      /db\.abcdefgh\.supabase\.co/,
    );
  });

  it('メッセージに実行しようとしたサブコマンドを含める', () => {
    expect(() => assertPrismaCommandAllowed(argvFor('migrate', 'reset'), PRODUCTION_URL)).toThrow(
      /prisma migrate reset/,
    );
  });

  it('メッセージに例外手順の参照先を含める', () => {
    expect(() => assertPrismaCommandAllowed(argvFor('db', 'push'), PRODUCTION_URL)).toThrow(
      /production-data\.md/,
    );
  });

  it('ホスト名にローカル名が含まれるだけの偽装ホストを拒否する', () => {
    const spoofed = 'postgresql://u:p@localhost.evil.example.com:5432/db';

    expect(() => assertPrismaCommandAllowed(argvFor('db', 'push'), spoofed)).toThrow(
      /prisma-guard/,
    );
  });

  it('URL として解釈できない接続先を、破壊的コマンドに対して拒否する', () => {
    expect(() => assertPrismaCommandAllowed(argvFor('db', 'push'), 'not-a-url')).toThrow(
      /URL として解釈できません/,
    );
  });
});
