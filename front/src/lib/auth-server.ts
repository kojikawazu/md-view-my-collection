import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

type RequireAdminResult = { ok: true; email: string } | { ok: false; response: NextResponse };

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
const supabaseAdmin = createClient(supabaseUrl, supabaseAnonKey);

// Cache verified tokens in memory (survives across warm invocations)
const authCache = new Map<string, { email: string; expiresAt: number }>();
const AUTH_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const maskEmail = (value: string) => {
  if (!value) return '';
  const at = value.indexOf('@');
  if (at <= 1) return '***';
  return `${value[0]}***@${value.slice(at + 1)}`;
};

export const requireAdmin = async (
  request: NextRequest,
  context: string,
): Promise<RequireAdminResult> => {
  const authHeader = request.headers.get('authorization');
  const token = authHeader ? authHeader.replace(/^Bearer\s+/i, '').trim() : '';

  if (!authHeader || !token) {
    console.warn(`[${context}] auth header missing`);
    return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const adminEmails = (process.env.ADMIN_EMAIL ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  // Check in-memory cache first (skip Supabase HTTP round-trip)
  const cached = authCache.get(token);
  if (cached && cached.expiresAt > Date.now()) {
    if (adminEmails.includes(cached.email.toLowerCase())) {
      return { ok: true, email: cached.email };
    }
    return { ok: false, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
  const email = authData?.user?.email ?? '';
  const emailMatches = adminEmails.includes(email.toLowerCase());

  if (authError || adminEmails.length === 0 || !emailMatches) {
    console.warn(`[${context}] auth check failed`, {
      hasAuthError: Boolean(authError),
      emailMasked: maskEmail(email),
      emailMatches,
    });
    return { ok: false, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  // Cache successful verification
  authCache.set(token, { email, expiresAt: Date.now() + AUTH_CACHE_TTL });

  // Evict expired entries to prevent memory leak
  if (authCache.size > 100) {
    const now = Date.now();
    for (const [key, val] of authCache) {
      if (val.expiresAt <= now) authCache.delete(key);
    }
  }

  return { ok: true, email };
};
