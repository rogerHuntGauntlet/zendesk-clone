import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res: response });
  const { data: { session } } = await supabase.auth.getSession();

  // Check if user is authenticated
  if (!session) {
    // Determine which portal they're trying to access
    const path = request.nextUrl.pathname;
    let loginPath = '/login';
    
    if (path.startsWith('/admin-portal')) {
      loginPath = '/admin-portal/login';
    } else if (path.startsWith('/employee-portal')) {
      loginPath = '/employee-portal/login';
    } else if (path.startsWith('/client-portal')) {
      loginPath = '/client-portal/login';
    }

    // Redirect to the appropriate login page
    const redirectUrl = new URL(loginPath, request.url);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: [
    '/knowledge-base/:path*',
    '/admin-portal/:path*',
    '/employee-portal/:path*',
    '/client-portal/:path*',
    // Add other protected routes here
  ]
};