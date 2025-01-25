import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res });
  
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // If user is not signed in and the current path is not /login,
  // redirect the user to /login
  if (!session && !request.nextUrl.pathname.endsWith('/login')) {
    const redirectUrl = new URL('/employee-portal/login', request.url);
    return NextResponse.redirect(redirectUrl);
  }

  // If user is signed in and the current path is /login,
  // redirect the user to /projects
  if (session && request.nextUrl.pathname.endsWith('/login')) {
    const redirectUrl = new URL('/employee-portal/projects', request.url);
    return NextResponse.redirect(redirectUrl);
  }

  return res;
}

// Specify which routes this middleware should run for
export const config = {
  matcher: '/employee-portal/:path*',
};
