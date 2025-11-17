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
  try {
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
        splashImageUrl: `${ROOT_URL}/1.png`, // Using 1.png temporarily - replace with splash-image.png later
        splashBackgroundColor: '#222222',
        webhookUrl: `${ROOT_URL}/api/webhook`,
        subtitle: 'Play Flappy Bird instantly',
        description: 'Challenge friends and beat high scores in this classic Flappy Bird game. Customize your bird and themes!',
        screenshotUrls: [
          `${ROOT_URL}/2.png`, // Using existing images
          `${ROOT_URL}/3.png`,
          `${ROOT_URL}/4.png`,
        ],
        primaryCategory: 'games',
        tags: ['game', 'flappy-bird', 'arcade', 'miniapp', 'baseapp'],
        heroImageUrl: `${ROOT_URL}/1.png`, // Using 1.png temporarily - replace with og-image.png later
        tagline: 'Play fast. Beat friends.',
        ogTitle: 'Flappy Mini',
        ogDescription: 'Play Flappy Bird instantly in Base App. Challenge friends and beat high scores!',
        ogImageUrl: `${ROOT_URL}/1.png`, // Using 1.png temporarily - replace with og-image.png later
        noindex: false,
      },
    }

    return NextResponse.json(manifest, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    })
  } catch (error) {
    console.error('Error generating Farcaster manifest:', error)
    return NextResponse.json(
      { error: 'Failed to generate manifest' },
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  }
}


