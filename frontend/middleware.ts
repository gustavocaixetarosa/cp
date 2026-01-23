import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This middleware is simplified since we're using client-side auth checking
// It only handles basic redirects for static routes
export function middleware(request: NextRequest) {
  // Allow all requests to pass through
  // Auth checking is done client-side via AuthGuard component
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public directory)
     * - api routes
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.webp).*)',
  ],
};
