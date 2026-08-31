import { NextResponse } from 'next/server';
import { checkPassword, createSessionToken, SESSION_COOKIE } from '@/lib/internal/auth';

function safeNextPath(next) {
  if (typeof next === 'string' && next.startsWith('/internal/')) {
    return next;
  }
  return '/internal/earnings';
}

export async function POST(request) {
  const formData = await request.formData();
  const password = formData.get('password');
  const next = safeNextPath(formData.get('next'));

  if (!checkPassword(password)) {
    const url = new URL('/internal/login', request.url);
    url.searchParams.set('next', next);
    url.searchParams.set('error', '1');
    return NextResponse.redirect(url, 303);
  }

  const token = createSessionToken();
  const response = NextResponse.redirect(new URL(next, request.url), 303);

  response.cookies.set(SESSION_COOKIE, token, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    secure: process.env.NODE_ENV === 'production',
  });

  return response;
}
