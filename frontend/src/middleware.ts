import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Paths that require authentication (currently disabled)
const PROTECTED_PATHS = [
  '/admin-dashboard',
  '/support-dashboard',
  '/client-dashboard',
  '/employee-dashboard'
];

// Paths that require specific roles (currently disabled)
const ROLE_PATHS = {
  '/admin-dashboard': ['admin'],
  '/support-dashboard': ['support', 'admin'],
  '/client-dashboard': ['client'],
  '/employee-dashboard': ['support', 'admin']
};

export function middleware(request: NextRequest) {
  // Simply allow all requests through
  return NextResponse.next();
  
  // Original authentication logic commented out for reference
  /*
  const { pathname } = request.nextUrl;

  if (PROTECTED_PATHS.some(path => pathname.startsWith(path))) {
    const token = request.cookies.get('auth_token')?.value;
    const userRole = request.cookies.get('user_role')?.value;

    if (!token) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    const requiredRoles = Object.entries(ROLE_PATHS).find(([path]) => pathname.startsWith(path))?.[1];
    if (requiredRoles && userRole && !requiredRoles.includes(userRole)) {
      switch (userRole) {
        case 'admin':
          return NextResponse.redirect(new URL('/admin-dashboard', request.url));
        case 'support':
          return NextResponse.redirect(new URL('/support-dashboard', request.url));
        case 'client':
          return NextResponse.redirect(new URL('/client-dashboard', request.url));
        default:
          return NextResponse.redirect(new URL('/', request.url));
      }
    }
  }
  */
}

export const config = {
  matcher: [
    '/admin-dashboard/:path*',
    '/support-dashboard/:path*',
    '/client-dashboard/:path*',
    '/employee-dashboard/:path*'
  ]
}; 