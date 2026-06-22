import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let res = NextResponse.next({ request })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: {
      getAll() { return request.cookies.getAll() },
      setAll(cs) {
        cs.forEach(({name,value}) => request.cookies.set(name,value))
        res = NextResponse.next({ request })
        cs.forEach(({name,value,options}) => res.cookies.set(name,value,options))
      },
    }}
  )
  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl
  if (pathname === '/') return NextResponse.redirect(new URL(user ? '/dashboard' : '/login', request.url))
  if (!pathname.startsWith('/login') && !pathname.startsWith('/api') && !user)
    return NextResponse.redirect(new URL('/login', request.url))
  if (pathname === '/login' && user)
    return NextResponse.redirect(new URL('/dashboard', request.url))
  return res
}
export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] }
