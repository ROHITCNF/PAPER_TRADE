import { NextResponse } from 'next/server';

export function middleware(request) {
  const webToken = request.cookies.get('web_token')?.value;
  const authCode = request.cookies.get('auth_code')?.value;
  const accessToken = request.cookies.get('access_token')?.value;
  const { pathname } = request.nextUrl;

  // Public pages (can be accessed without any token)
  const publicRoutes = ['/login', '/signup', '/'];

  // If any of the 3 tokens are missing → Block user
  const missingLogin = !webToken;
  const missingAuthCode = !authCode;
  const missingAccessToken = !accessToken;

  // Check if user is accessing protected route
  const isProtectedRoute = !publicRoutes.includes(pathname);

  // Block access if missing any required token
  if (isProtectedRoute && (missingLogin || missingAuthCode || missingAccessToken)) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If already fully logged in, avoid login/signup
  if (!missingLogin && !missingAuthCode && !missingAccessToken && publicRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL('/profile', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/profile/:path*',
    '/home/:path*',
    '/trade/:path*',
    '/login',
    '/signup'
  ]
};
