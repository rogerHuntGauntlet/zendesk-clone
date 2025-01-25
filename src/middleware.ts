import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  console.log('[Middleware] Processing request for:', request.nextUrl.pathname);
  
  // Skip auth check for login and reset-password pages
  const path = request.nextUrl.pathname;
  if (path.includes('/login') || path.includes('/reset-password')) {
    console.log('[Middleware] Skipping auth check for login/reset page');
    return NextResponse.next();
  }

  const response = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res: response });
  
  try {
    console.log('[Middleware] Checking session');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('[Middleware] Session error:', sessionError);
      return redirectToLogin(request);
    }

    // Check if user is authenticated
    if (!session) {
      console.log('[Middleware] No session found');
      return redirectToLogin(request);
    }

    console.log('[Middleware] Session found for user:', session.user.id);

    // If accessing admin portal, verify admin role
    if (path.startsWith('/admin-portal')) {
      console.log('[Middleware] Verifying admin role');
      const { data: admin, error: adminError } = await supabase
        .from('zen_users')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (adminError || !admin || admin.role !== 'admin') {
        console.error('[Middleware] Admin verification failed:', adminError || 'User is not an admin');
        return NextResponse.redirect(new URL('/', request.url));
      }
      console.log('[Middleware] Admin role verified');
    }

    // If accessing client portal, verify client role
    if (path.startsWith('/client-portal')) {
      console.log('[Middleware] Verifying client role');
      const { data: client, error: clientError } = await supabase
        .from('zen_clients')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (clientError || !client) {
        console.error('[Middleware] Client verification failed:', clientError || 'User is not a client');
        return NextResponse.redirect(new URL('/', request.url));
      }
      console.log('[Middleware] Client role verified');
    }

    // If accessing employee portal, verify employee role
    if (path.startsWith('/employee-portal')) {
      console.log('[Middleware] Verifying employee role for user:', session.user.id);
      console.log('[Middleware] User email:', session.user.email);
      
      // First check zen_users table
      const { data: userData, error: userError } = await supabase
        .from('zen_users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      console.log('[Middleware] zen_users check:', { userData, userError });

      // Then check zen_employees table
      const { data: employee, error: employeeError } = await supabase
        .from('zen_employees')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      console.log('[Middleware] zen_employees check:', { employee, employeeError });

      if (employeeError || !employee) {
        console.error('[Middleware] Employee verification failed:', employeeError || 'User is not an employee');
        console.log('[Middleware] Redirecting to homepage');
        return NextResponse.redirect(new URL('/', request.url));
      }
      console.log('[Middleware] Employee role verified successfully');
    }

    return response;
  } catch (error) {
    console.error('[Middleware] Unexpected error:', error);
    return redirectToLogin(request);
  }
}

function redirectToLogin(request: NextRequest) {
  const path = request.nextUrl.pathname;
  let loginPath = '/login';
  
  if (path.startsWith('/admin-portal')) {
    loginPath = '/admin-portal/login';
  } else if (path.startsWith('/employee-portal')) {
    loginPath = '/employee-portal/login';
  } else if (path.startsWith('/client-portal')) {
    loginPath = '/client-portal/login';
  }

  return NextResponse.redirect(new URL(loginPath, request.url));
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