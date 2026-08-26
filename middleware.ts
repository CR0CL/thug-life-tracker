import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Если пользователь не авторизован и пытается зайти в main
  if (!user && request.nextUrl.pathname.startsWith('/digest')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Если пользователь авторизован и пытается зайти на login
  if (user && request.nextUrl.pathname === '/login') {
    return NextResponse.redirect(new URL('/digest', request.url))
  }

  return response
}

export const config = {
  matcher: ['/digest', '/login', '/tasks', '/notes', '/money', '/food', '/meetings', '/rituals'],
}