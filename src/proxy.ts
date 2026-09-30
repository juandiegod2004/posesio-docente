import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { ROLES } from '@/lib/constants/roles';
import type { UserRole } from '@/types/auth';

function sectionForPath(pathname: string): string | null {
  if (pathname.startsWith('/dashboard/admin')) return '/dashboard/admin';
  if (pathname.startsWith('/dashboard/validador')) return '/dashboard/validador';
  if (pathname.startsWith('/dashboard/documentos')) return '/dashboard/documentos';
  // Ojo con el orden: "/dashboard/docentes" (directorio, plural) empieza igual que
  // "/dashboard/docente" (checklist del rol DOCENTE, singular) — hay que chequear el plural primero.
  if (pathname.startsWith('/dashboard/docentes')) return '/dashboard/docentes';
  if (pathname.startsWith('/dashboard/docente')) return '/dashboard/docente';
  return null;
}

function roleHome(rol: string): string {
  return ROLES[rol as UserRole]?.homePath ?? '/dashboard/docente';
}

function roleAllowsSection(rol: string, section: string): boolean {
  const config = ROLES[rol as UserRole];
  if (!config) return false;
  return config.allowedPaths.includes(section);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  // Revalida el JWT contra Supabase Auth (no solo lo decodifica localmente).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // El JWT de Supabase no trae el rol de la app: lo pedimos al backend, que es
  // quien de verdad conoce y protege los permisos por rol (esto es solo UX).
  const {
    data: { session },
  } = await supabase.auth.getSession();

  let rol: string | null = null;
  try {
    const meRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${session?.access_token}` },
      cache: 'no-store',
    });
    if (meRes.ok) {
      const usuario = await meRes.json();
      rol = usuario.rol;
    }
  } catch {
    rol = null;
  }

  if (!rol) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    loginUrl.searchParams.set('notice', 'session-error');
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === '/dashboard') {
    return NextResponse.redirect(new URL(roleHome(rol), request.url));
  }

  const section = sectionForPath(pathname);
  if (section && !roleAllowsSection(rol, section)) {
    const home = new URL(roleHome(rol), request.url);
    home.searchParams.set('notice', 'forbidden');
    return NextResponse.redirect(home);
  }

  return response;
}

export const config = {
  // Excluye requests de prefetch: sin esto, cada <Link> del sidebar dispara su propio
  // fetch al backend aquí, y esos fetches concurrentes causaban "CLOSED writable stream" en dev.
  matcher: [
    {
      source: '/dashboard/:path*',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
