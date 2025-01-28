import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  try {
    const path = new URL(request.url).pathname;
    console.log('[Middleware] Processing request for:', path);

    // Skip auth check for login pages
    if (path.includes('/login') || path.includes('/reset-password')) {
      console.log('[Middleware] Skipping auth check for login/reset page');
      return NextResponse.next();
    }

    const response = NextResponse.next();
    const supabase = createMiddlewareClient({ req: request, res: response });
    
    console.log('[Middleware] Checking session');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('[Middleware] Session error:', sessionError);
      const redirectUrl = new URL('/admin-portal/login', request.url);
      return NextResponse.redirect(redirectUrl);
    }

    // Check if user is authenticated
    if (!session) {
      console.log('[Middleware] No session found, redirecting to login');
      const redirectUrl = new URL('/admin-portal/login', request.url);
      return NextResponse.redirect(redirectUrl);
    }

    // Validate session user data
    if (!session.user?.id || !session.user?.email) {
      console.error('[Middleware] Invalid session user data:', session.user);
      const redirectUrl = new URL('/admin-portal/login', request.url);
      return NextResponse.redirect(redirectUrl);
    }

    console.log('[Middleware] Session found for user:', session.user.id);
    console.log('[Middleware] User email:', session.user.email);
    console.log('[Middleware] Verifying admin role');

    // Create admin client with service role for admin operations
    const adminClient = createMiddlewareClient({ req: request, res: response }, {
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY
    });

    // Check if user exists in zen_project_admins
    const { data: admin, error: adminError } = await adminClient
      .from('zen_project_admins')
      .select('*')
      .eq('user_id', session.user.id)
      .single();

    if (adminError && adminError.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.error('[Middleware] Error checking admin status:', {
        error: adminError,
        message: adminError.message,
        details: adminError.details,
        hint: adminError.hint,
        code: adminError.code
      });
      const redirectUrl = new URL('/admin-portal/login', request.url);
      console.log('[Middleware] Redirecting to login due to admin check error');
      return NextResponse.redirect(redirectUrl);
    }

    // If not in zen_project_admins, add them
    if (!admin) {
      console.log('[Middleware] User not found in zen_project_admins, attempting to add:', {
        user_id: session.user.id,
        email: session.user.email
      });

      try {
        const { data: insertData, error: insertError } = await adminClient
          .from('zen_project_admins')
          .insert([{
            user_id: session.user.id,
            projects: [],
            permissions: []
          }])
          .select()
          .single();

        if (insertError) {
          console.error('[Middleware] Failed to add user as admin:', {
            error: insertError,
            message: insertError.message,
            details: insertError.details,
            hint: insertError.hint,
            code: insertError.code,
            user_id: session.user.id
          });
          
          // Log the full error for debugging
          console.error('[Middleware] Full insert error:', insertError);
          
          const redirectUrl = new URL('/', request.url);
          console.log('[Middleware] Redirecting to homepage due to admin creation failure');
          return NextResponse.redirect(redirectUrl);
        }

        if (!insertData) {
          console.error('[Middleware] No data returned from admin insert');
          const redirectUrl = new URL('/', request.url);
          console.log('[Middleware] Redirecting to homepage due to no insert data');
          return NextResponse.redirect(redirectUrl);
        }

        console.log('[Middleware] Successfully added user as admin:', {
          user_id: insertData.user_id,
          created_at: insertData.created_at
        });
      } catch (insertCatchError: any) {
        console.error('[Middleware] Unexpected error during admin creation:', {
          error: insertCatchError,
          message: insertCatchError?.message,
          stack: insertCatchError?.stack,
          user_id: session.user.id
        });
        const redirectUrl = new URL('/', request.url);
        console.log('[Middleware] Redirecting to homepage due to unexpected error');
        return NextResponse.redirect(redirectUrl);
      }
    } else {
      console.log('[Middleware] User is already an admin:', {
        user_id: admin.user_id,
        created_at: admin.created_at
      });
    }

    console.log('[Middleware] Admin access verified, proceeding with request');
    return response;
  } catch (error: any) {
    console.error('[Middleware] Unexpected error:', {
      error,
      message: error?.message,
      stack: error?.stack
    });
    const redirectUrl = new URL('/admin-portal/login', request.url);
    console.log('[Middleware] Redirecting to login due to unexpected error');
    return NextResponse.redirect(redirectUrl);
  }
}

export const config = {
  matcher: ['/admin-portal/:path*']
};
