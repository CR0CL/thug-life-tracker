import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Thug Life Tracker',
  description: 'Track your life like a boss',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <head>
        <link rel="stylesheet" href="/styles.css" />
      </head>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}