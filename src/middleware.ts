import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect dashboard routes
  if (pathname.startsWith('/dashboard')) {
    const authToken = request.cookies.get('auth_token')?.value;
    const authRole = request.cookies.get('auth_role')?.value;

    // 1. Not authenticated -> Redirect to login
    if (!authToken) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // 2. Role-specific route protections
    if (pathname.startsWith('/dashboard/admin') && authRole !== 'administrador') {
      const unauthUrl = new URL('/unauthorized', request.url);
      unauthUrl.searchParams.set('required', 'administrador');
      unauthUrl.searchParams.set('current', authRole || 'desconocido');
      return NextResponse.redirect(unauthUrl);
    }

    if (
      pathname.startsWith('/dashboard/coordinador') &&
      authRole !== 'coordinador' &&
      authRole !== 'administrador'
    ) {
      const unauthUrl = new URL('/unauthorized', request.url);
      unauthUrl.searchParams.set('required', 'coordinador');
      unauthUrl.searchParams.set('current', authRole || 'desconocido');
      return NextResponse.redirect(unauthUrl);
    }

    if (
      pathname.startsWith('/dashboard/docente') &&
      authRole !== 'docente' &&
      authRole !== 'administrador'
    ) {
      const unauthUrl = new URL('/unauthorized', request.url);
      unauthUrl.searchParams.set('required', 'docente');
      unauthUrl.searchParams.set('current', authRole || 'desconocido');
      return NextResponse.redirect(unauthUrl);
    }

    if (
      pathname.startsWith('/dashboard/estudiante') &&
      authRole !== 'estudiante' &&
      authRole !== 'administrador'
    ) {
      const unauthUrl = new URL('/unauthorized', request.url);
      unauthUrl.searchParams.set('required', 'estudiante');
      unauthUrl.searchParams.set('current', authRole || 'desconocido');
      return NextResponse.redirect(unauthUrl);
    }

    if (
      pathname.startsWith('/dashboard/documentos') &&
      authRole !== 'coordinador' &&
      authRole !== 'administrador'
    ) {
      const unauthUrl = new URL('/unauthorized', request.url);
      unauthUrl.searchParams.set('required', 'coordinador');
      unauthUrl.searchParams.set('current', authRole || 'desconocido');
      return NextResponse.redirect(unauthUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
