import { afterEach, describe, expect, it, vi } from 'vitest';
import { resolveAuthMode } from '@/lib/auth-mode';

describe('resolveAuthMode', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('正常: development で local 指定なら local', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('NEXT_PUBLIC_AUTH_MODE', 'local');
    expect(resolveAuthMode()).toBe('local');
  });

  it('正常: test で local 指定なら local', () => {
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('NEXT_PUBLIC_AUTH_MODE', 'local');
    expect(resolveAuthMode()).toBe('local');
  });

  it('正常: 未指定なら supabase', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('NEXT_PUBLIC_AUTH_MODE', '');
    expect(resolveAuthMode()).toBe('supabase');
  });

  it('準正常: local 以外の値（大文字違い含む）は supabase', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('NEXT_PUBLIC_AUTH_MODE', 'LOCAL');
    expect(resolveAuthMode()).toBe('supabase');
  });

  // 以下が Issue #207 の本命。local 指定が本番に紛れ込んでも認証を迂回させない
  it('異常: production で local 指定でも supabase', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_AUTH_MODE', 'local');
    expect(resolveAuthMode()).toBe('supabase');
  });

  it('異常: NODE_ENV が想定外の値なら local 指定でも supabase（許可リスト方式）', () => {
    vi.stubEnv('NODE_ENV', 'staging');
    vi.stubEnv('NEXT_PUBLIC_AUTH_MODE', 'local');
    expect(resolveAuthMode()).toBe('supabase');
  });

  it('異常: NODE_ENV が空なら local 指定でも supabase', () => {
    vi.stubEnv('NODE_ENV', '');
    vi.stubEnv('NEXT_PUBLIC_AUTH_MODE', 'local');
    expect(resolveAuthMode()).toBe('supabase');
  });
});
