import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Proxy de Next.js 16 para habilitar CORS en todas las rutas /api/*
 * Permite que clientes móviles (Expo / React Native) y navegadores web
 * puedan interactuar con la API sin bloqueos de origen.
 */
export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api')) {
    // Manejar preflight OPTIONS
    if (request.method === 'OPTIONS') {
      const response = new NextResponse(null, { status: 204 });
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set(
        'Access-Control-Allow-Methods',
        'GET, POST, PUT, PATCH, DELETE, OPTIONS'
      );
      response.headers.set(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization, X-Requested-With'
      );
      response.headers.set('Access-Control-Max-Age', '86400');
      return response;
    }

    // Peticiones regulares
    const response = NextResponse.next();
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, PATCH, DELETE, OPTIONS'
    );
    response.headers.set(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Requested-With'
    );
    return response;
  }

  return NextResponse.next();
}

export default proxy;

export const config = {
  matcher: ['/api/:path*'],
};
