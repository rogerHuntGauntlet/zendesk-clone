import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  try {
    console.log('[AdminMiddleware] Processing request for:', request.url);
    const response = NextResponse.next();
    const supabase = createMiddlewareClient({ req: request, res: response });
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('[AdminMiddleware] Session error:', sessionError);
      const redirectUrl = new URL('/admin-portal/login', request.url);
      return NextResponse.redirect(redirectUrl);
    }

    // Check if user is authenticated
    if (!session) {
      console.log('[AdminMiddleware] No session found, redirecting to login');
      const redirectUrl = new URL('/admin-portal/login', request.url);
      return NextResponse.redirect(redirectUrl);
    }

    console.log('[AdminMiddleware] Session found for user:', session.user.id);

    // Check if user is an admin
    const { data: admin, error: adminError } = await supabase
      .from('zen_users')
      .select('*')
      .eq('id', session.user.id)
      .eq('role', 'admin')
      .single();

    if (adminError || !admin) {
      console.error('[AdminMiddleware] Admin check failed:', adminError || 'User is not an admin');
      const redirectUrl = new URL('/', request.url);
      return NextResponse.redirect(redirectUrl);
    }

    console.log('[AdminMiddleware] Admin access verified');
    return response;
  } catch (error) {
    console.error('[AdminMiddleware] Unexpected error:', error);
    const redirectUrl = new URL('/admin-portal/login', request.url);
    return NextResponse.redirect(redirectUrl);
  }
}

export const config = {
  matcher: ['/admin-portal/:path*']
};
