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
    if (
      pathname.startsWith('/dashboard/admin') &&
      authRole !== 'super_usuario' &&
      authRole !== 'administrativo'
    ) {
      const unauthUrl = new URL('/unauthorized', request.url);
      unauthUrl.searchParams.set('required', 'super_usuario');
      unauthUrl.searchParams.set('current', authRole || 'desconocido');
      return NextResponse.redirect(unauthUrl);
    }

    if (
      pathname.startsWith('/dashboard/validador') &&
      authRole !== 'validador' &&
      authRole !== 'super_usuario' &&
      authRole !== 'administrativo'
    ) {
      const unauthUrl = new URL('/unauthorized', request.url);
      unauthUrl.searchParams.set('required', 'validador');
      unauthUrl.searchParams.set('current', authRole || 'desconocido');
      return NextResponse.redirect(unauthUrl);
    }

    if (pathname.startsWith('/dashboard/docente') && authRole !== 'docente') {
      const unauthUrl = new URL('/unauthorized', request.url);
      unauthUrl.searchParams.set('required', 'docente');
      unauthUrl.searchParams.set('current', authRole || 'desconocido');
      return NextResponse.redirect(unauthUrl);
    }

    // /dashboard/documentos shows a docente's own submitted files — only the
    // docente role uploads documents, so only docente can reach it.
    if (pathname.startsWith('/dashboard/documentos') && authRole !== 'docente') {
      const unauthUrl = new URL('/unauthorized', request.url);
      unauthUrl.searchParams.set('required', 'docente');
      unauthUrl.searchParams.set('current', authRole || 'desconocido');
      return NextResponse.redirect(unauthUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
