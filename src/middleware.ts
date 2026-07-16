import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options as any)
          )
        },
      },
    }
  )

  // IMPORTANTE: não usar getUser() no middleware pois pode causar loop
  // Apenas verificar se existe cookie de sessão
  const { data: { session } } = await supabase.auth.getSession()
  const { pathname } = request.nextUrl

  if (pathname === '/') {
    return NextResponse.redirect(
      new URL(session ? '/dashboard' : '/login', request.url)
    )
  }

  if (pathname.startsWith('/login')) {
    if (session) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return supabaseResponse
  }

  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/')
  ) {
    return supabaseResponse
  }

  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
