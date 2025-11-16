import { NextResponse } from 'next/server'

// Update these values with your actual domain and Base Account address after deployment
const ROOT_URL = process.env.NEXT_PUBLIC_URL || 'https://flappy-b.vercel.app'
const OWNER_ADDRESS = process.env.BASE_ACCOUNT_ADDRESS || '0x71d5f27c5009fB33ed3e7BAF57b793C0A8879927' // Add your Base Account address

// Account association fields - these will be generated using Base Build tool
// See: https://www.base.dev/preview?tab=account
const accountAssociation = {
  header: 'eyJmaWQiOjE0MTIwMzMsInR5cGUiOiJjdXN0b2R5Iiwia2V5IjoiMHgxNkY4Qzk1NGY2RDQ2OTRiN0M1NUFGOWEwYzFhOGQ2NkViMDkxMDdBIn0',
  payload: 'eyJkb21haW4iOiJmbGFwcHktYi52ZXJjZWwuYXBwIn0',
  signature: 'impZZB88GRbS4iADVP0mBGQKW6fY1TxaVtNfPhLUyFNxbJRgbC07jiaV9L8aIUX9Kn/19qtMbk3Ik0uj0Y/0VBw=',
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
      iconUrl: `${ROOT_URL}/1.png`,
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
      tagline: 'Play fast. Beat friends.',
      ogTitle: 'Flappy Mini',
      ogDescription: 'Play Flappy Bird instantly in Base App. Challenge friends and beat high scores!',
      ogImageUrl: `${ROOT_URL}/og-image.png`,
      noindex: false,
    },
  }

  return NextResponse.json(manifest)
}


