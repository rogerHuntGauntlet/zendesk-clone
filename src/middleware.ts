import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Paths that require authentication
const PROTECTED_PATHS = [
  '/project-admin',
  '/employee-dashboard',
  '/client-dashboard',
];

// Paths that require specific roles
const ROLE_PATHS = {
  '/employee-dashboard': ['employee'],
  '/client-dashboard': ['client'],
};

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    'https://rlaxacnkrfohotpyvnam.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsYXhhY25rcmZvaG90cHl2bmFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYxOTk3NjcsImV4cCI6MjA1MTc3NTc2N30.djQ3ExBd5Y2wb2sUOZCs5g72U2EgdYte7NqFiLesE9Y',
    {
      cookies: {
        get(name: string) {
          console.log('Middleware - Getting cookie:', name);
          const value = request.cookies.get(name)?.value;
          console.log('Middleware - Cookie value exists:', !!value);
          return value;
        },
        set(name: string, value: string, options: CookieOptions) {
          console.log('Middleware - Setting cookie:', name);
          response.cookies.set({
            name,
            value,
            ...options,
            path: '/',
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 31536000, // 1 year
          });
        },
        remove(name: string, options: CookieOptions) {
          console.log('Middleware - Removing cookie:', name);
          response.cookies.set({
            name,
            value: '',
            ...options,
            path: '/',
            maxAge: 0,
          });
        },
      },
    }
  )

  const { pathname } = request.nextUrl;

  // Check if the path requires authentication
  if (PROTECTED_PATHS.some(path => pathname.startsWith(path))) {
    const { data: { session } } = await supabase.auth.getSession()

    console.log('Middleware - Current path:', pathname);
    console.log('Middleware - Session:', session ? 'exists' : 'null');
    if (session) {
      console.log('Middleware - User role:', session.user.user_metadata.role);
    }

    if (!session) {
      console.log('No session found, redirecting to login');
      return NextResponse.redirect(new URL('/', request.url))
    }

    const userRole = session.user.user_metadata.role;
    const requiredRoles = Object.entries(ROLE_PATHS).find(([path]) => pathname.startsWith(path))?.[1];

    // If accessing a specific project
    const projectId = request.nextUrl.searchParams.get('project');
    if (projectId && userRole !== 'project_admin') {
      // Check if user has access to this project
      const { data: projectAccess } = await supabase
        .from('project_members')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('project_id', projectId)
        .single();

      if (!projectAccess) {
        // If no project access, redirect back to their dashboard
        return NextResponse.redirect(new URL('/project-admin', request.url));
      }
    }

    // Check role-specific path access
    if (requiredRoles && !requiredRoles.includes(userRole)) {
      // If they don't have the required role, redirect to project-admin
      return NextResponse.redirect(new URL('/project-admin', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/project-admin/:path*',
    '/employee-dashboard/:path*',
    '/client-dashboard/:path*',
  ],
}; 