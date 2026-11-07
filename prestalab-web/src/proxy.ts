import { NextResponse, type NextRequest } from 'next/server';

/**
 * Proxy Next.js 16 (reemplazo de middleware.ts)
 * 1. Habilita CORS para la app móvil en rutas /api/*
 * 2. Protección de rutas web: requiere cookie de sesión salvo rutas públicas.
 */
const PUBLIC = ['/login', '/register'];
const PUBLIC_PREFIX = [
  '/api/health',
  '/api/auth',
  '/api/mobile',
  '/_next',
  '/favicon',
  '/icon',
  '/images',
];

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Max-Age': '86400',
};

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Manejo de CORS OPTIONS (preflight para la app móvil)
  if (request.method === 'OPTIONS' && pathname.startsWith('/api/')) {
    return new NextResponse(null, {
      status: 204,
      headers: CORS_HEADERS,
    });
  }

  // 2. Rutas públicas (login, register, api/auth, api/mobile, assets)
  if (PUBLIC.includes(pathname) || PUBLIC_PREFIX.some((p) => pathname.startsWith(p))) {
    const response = NextResponse.next();
    if (pathname.startsWith('/api/')) {
      Object.entries(CORS_HEADERS).forEach(([key, val]) => {
        response.headers.set(key, val);
      });
    }
    return response;
  }

  const hasSession = request.cookies.has('prestalab_session');

  // 3. APIs protegidas (no públicas): si no hay cookie, 401
  if (pathname.startsWith('/api/')) {
    if (!hasSession) {
      return NextResponse.json(
        { success: false, error: 'Debes iniciar sesión.' },
        { status: 401, headers: CORS_HEADERS },
      );
    }
    const response = NextResponse.next();
    Object.entries(CORS_HEADERS).forEach(([key, val]) => {
      response.headers.set(key, val);
    });
    return response;
  }

  // 4. Páginas protegidas: redirigir a /login si no hay sesión
  if (!hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export default proxy;

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|ico|webp)$).*)'],
};
