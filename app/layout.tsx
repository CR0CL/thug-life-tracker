import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '@/styles/globals.css'

const inter = Inter({ 
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Thug Life Tracker',
  description: 'Track your life like a boss',
  applicationName: 'Thug Life Tracker',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  themeColor: '#0a0a0a',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
  },
  // Мета-теги для Telegram
  other: {
    'telegram:bot': '@thug_life_tracker_bot',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru" className="dark">
      <head>
        <script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}