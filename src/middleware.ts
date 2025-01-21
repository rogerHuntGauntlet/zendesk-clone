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
  '/project-admin': ['project_admin'],
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
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { pathname } = request.nextUrl;

  // Check if the path requires authentication
  if (PROTECTED_PATHS.some(path => pathname.startsWith(path))) {
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
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
        // Redirect to their dashboard if they don't have access
        switch (userRole) {
          case 'employee':
            return NextResponse.redirect(new URL('/employee-dashboard', request.url));
          case 'client':
            return NextResponse.redirect(new URL('/client-dashboard', request.url));
          default:
            return NextResponse.redirect(new URL('/', request.url));
        }
      }
    }

    if (requiredRoles && !requiredRoles.includes(userRole)) {
      // Redirect to appropriate dashboard based on role
      switch (userRole) {
        case 'project_admin':
          return NextResponse.redirect(new URL('/project-admin', request.url));
        case 'employee':
          return NextResponse.redirect(new URL('/employee-dashboard', request.url));
        case 'client':
          return NextResponse.redirect(new URL('/client-dashboard', request.url));
        default:
          return NextResponse.redirect(new URL('/', request.url));
      }
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