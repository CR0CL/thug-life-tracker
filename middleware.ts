import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Просто пропускаем все запросы
  return NextResponse.next()
}

export const config = {
  matcher: [],
}