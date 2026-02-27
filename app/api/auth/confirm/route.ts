import { NextRequest, NextResponse } from 'next/server'

// This route serves a small HTML page that reads the hash fragment
// and redirects to the dashboard. The Supabase client-side SDK
// with detectSessionInUrl: true will pick up the token.
export async function GET(request: NextRequest) {
  const { origin } = new URL(request.url)
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head><title>Authenticating...</title></head>
    <body>
      <p>Signing you in...</p>
      <script>
        // The hash fragment contains the access token from Supabase implicit flow
        if (window.location.hash) {
          // Redirect to dashboard - AuthProvider with detectSessionInUrl will handle it
          window.location.href = '/dashboard' + window.location.hash;
        } else {
          window.location.href = '/login?error=auth';
        }
      </script>
    </body>
    </html>
  `
  
  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html' },
  })
}
