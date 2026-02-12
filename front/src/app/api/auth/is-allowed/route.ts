import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

type AllowedResponse = {
  allowed: boolean;
};

const getAllowedEmails = () =>
  (process.env.ADMIN_EMAIL ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

const isAllowedEmail = (email: string | null | undefined) => {
  const allowedEmails = getAllowedEmails();
  if (!email || allowedEmails.length === 0) return false;
  return allowedEmails.includes(email.toLowerCase());
};

const extractBearerToken = (request: NextRequest) => {
  const authorization = request.headers.get('authorization') ?? '';
  if (!authorization.startsWith('Bearer ')) return null;
  return authorization.slice('Bearer '.length).trim() || null;
};

export async function POST(request: NextRequest) {
  const authMode = process.env.NEXT_PUBLIC_AUTH_MODE ?? 'supabase';

  if (authMode === 'local') {
    const body = (await request.json().catch(() => ({}))) as { email?: string | null };
    return NextResponse.json<AllowedResponse>({ allowed: isAllowedEmail(body.email) });
  }

  const accessToken = extractBearerToken(request);
  if (!accessToken) {
    return NextResponse.json<AllowedResponse>({ allowed: false }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[auth] missing supabase env for admin email check');
    return NextResponse.json<AllowedResponse>({ allowed: false }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error) {
    console.error('[auth] failed to verify access token', error.message);
    return NextResponse.json<AllowedResponse>({ allowed: false }, { status: 401 });
  }

  return NextResponse.json<AllowedResponse>({
    allowed: isAllowedEmail(data.user?.email),
  });
}
