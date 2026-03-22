import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

type RequireAdminResult = { ok: true; email: string } | { ok: false; response: NextResponse };

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

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
  const adminEmails = (process.env.ADMIN_EMAIL ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { data: authData, error: authError } = await supabase.auth.getUser(token);
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

  return { ok: true, email };
};
