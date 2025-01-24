import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res: response });
  const { data: { session } } = await supabase.auth.getSession();

  // Check if user is authenticated
  if (!session) {
    const redirectUrl = new URL('/client-portal/login', request.url);
    return NextResponse.redirect(redirectUrl);
  }

  // Check if user is a client
  const { data: client } = await supabase
    .from('zen_clients')
    .select('*')
    .eq('user_id', session.user.id)
    .single();

  if (!client) {
    const redirectUrl = new URL('/', request.url);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: ['/client-portal/projects/:path*']
}; 