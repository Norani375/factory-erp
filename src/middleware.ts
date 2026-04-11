import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  const { pathname } = request.nextUrl;

  // Allow login page, auth API, seed API, and static files
  if (pathname.startsWith('/login') || pathname.startsWith('/api/auth') || pathname.startsWith('/api/seed') ||
      pathname.startsWith('/_next') || pathname.startsWith('/favicon')) {
    return NextResponse.next();
  }

  if (!token) {
    if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'لطفاً وارد شوید' }, { status: 401 });
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('Invalid');
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    if (payload.exp < Date.now()) {
      const response = pathname.startsWith('/api/')
        ? NextResponse.json({ error: 'نشست منقضی شده' }, { status: 401 })
        : NextResponse.redirect(new URL('/login', request.url));
      response.cookies.set('auth-token', '', { maxAge: 0, path: '/' });
      return response;
    }
  } catch {
    const response = pathname.startsWith('/api/')
      ? NextResponse.json({ error: 'توکن نامعتبر' }, { status: 401 })
      : NextResponse.redirect(new URL('/login', request.url));
    response.cookies.set('auth-token', '', { maxAge: 0, path: '/' });
    return response;
  }

  return NextResponse.next();
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] };
