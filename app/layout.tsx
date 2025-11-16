import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'

// Update these URLs with your actual domain after deployment
const ROOT_URL = process.env.NEXT_PUBLIC_URL || 'https://your-app.vercel.app'

export const metadata: Metadata = {
  title: 'Flappy Mini - Flappy Bird Mini App',
  description: 'Play Flappy Bird instantly in Base App. Challenge friends and beat high scores!',
  other: {
    'fc:miniapp': JSON.stringify({
      version: 'next',
      imageUrl: `${ROOT_URL}/og-image.png`,
      button: {
        title: 'Play Flappy Mini',
        action: {
          type: 'launch_miniapp',
          name: 'Flappy Mini',
          url: ROOT_URL,
          splashImageUrl: `${ROOT_URL}/splash-image.png`,
          splashBackgroundColor: '#222222',
        },
      },
    }),
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}


