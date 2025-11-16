import { NextResponse } from 'next/server'

// Update these values with your actual domain and Base Account address after deployment
const ROOT_URL = process.env.NEXT_PUBLIC_URL || 'https://your-app.vercel.app'
const OWNER_ADDRESS = process.env.BASE_ACCOUNT_ADDRESS || '0x' // Add your Base Account address

// Account association fields - these will be generated using Base Build tool
// See: https://www.base.dev/preview?tab=account
const accountAssociation = {
  header: '',
  payload: '',
  signature: '',
}

export async function GET() {
  const manifest = {
    accountAssociation,
    baseBuilder: {
      ownerAddress: OWNER_ADDRESS,
    },
    miniapp: {
      version: '1',
      name: 'Flappy Mini',
      homeUrl: ROOT_URL,
      iconUrl: `${ROOT_URL}/icon.png`,
      splashImageUrl: `${ROOT_URL}/splash-image.png`,
      splashBackgroundColor: '#222222',
      webhookUrl: `${ROOT_URL}/api/webhook`,
      subtitle: 'Play Flappy Bird instantly',
      description: 'Challenge friends and beat high scores in this classic Flappy Bird game. Customize your bird and themes!',
      screenshotUrls: [
        `${ROOT_URL}/screenshot-1.png`,
        `${ROOT_URL}/screenshot-2.png`,
        `${ROOT_URL}/screenshot-3.png`,
      ],
      primaryCategory: 'games',
      tags: ['game', 'flappy-bird', 'arcade', 'miniapp', 'baseapp'],
      heroImageUrl: `${ROOT_URL}/og-image.png`,
      tagline: 'Play instantly, share with friends',
      ogTitle: 'Flappy Mini - Flappy Bird Mini App',
      ogDescription: 'Play Flappy Bird instantly in Base App. Challenge friends and beat high scores!',
      ogImageUrl: `${ROOT_URL}/og-image.png`,
      noindex: false,
    },
  }

  return NextResponse.json(manifest)
}


