# Flappy Mini - Flappy Bird Mini App for Farcaster/Base App

A Flappy Bird game built as a Mini App for Farcaster and Base App. Play instantly, share with friends, and challenge high scores!

## Features

- 🎮 Classic Flappy Bird gameplay
- 🎨 Customizable bird skins (Yellow, Red, Blue)
- 🌈 Multiple themes (Classic, Lava, Snow)
- 📊 Dynamic difficulty scaling
- 🏆 Medal system (Bronze, Silver, Gold, Diamond)
- 🔊 Sound effects using Tone.js
- 📱 Fully responsive and mobile-optimized
- 🎯 Social sharing ready for Base App

## Tech Stack

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Farcaster MiniApp SDK** - Base App integration
- **Tone.js** - Audio synthesis
- **Canvas API** - Game rendering

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Base App account (for deployment)
- Vercel account (recommended for hosting)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
Create a `.env.local` file:
```env
NEXT_PUBLIC_URL=https://your-app.vercel.app
BASE_ACCOUNT_ADDRESS=0xYourBaseAccountAddress
```

3. Run development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Deployment to Base App

### Step 1: Deploy to Vercel

1. Push your code to GitHub
2. Import the repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Step 2: Generate Account Association

1. Go to [Base Build Preview Tool](https://www.base.dev/preview?tab=account)
2. Enter your app URL (e.g., `your-app.vercel.app`)
3. Click "Verify" and follow instructions
4. Copy the `accountAssociation` object

### Step 3: Update Manifest

1. Update `app/.well-known/farcaster.json/route.ts`:
   - Add your `accountAssociation` credentials
   - Update `OWNER_ADDRESS` with your Base Account address
   - Update `ROOT_URL` with your deployed URL

2. Push changes to trigger new deployment

### Step 4: Add Images

Create and upload these images to your public folder:
- `icon.png` - App icon (512x512px recommended)
- `splash-image.png` - Splash screen (1200x630px recommended)
- `og-image.png` - Open Graph image (1200x630px)
- `screenshot-1.png`, `screenshot-2.png`, `screenshot-3.png` - Screenshots

### Step 5: Preview and Publish

1. Preview your app at [Base Build Preview](https://www.base.dev/preview)
2. Verify all metadata and embeds
3. Post your app URL in Base App to publish!

## Project Structure

```
├── app/
│   ├── .well-known/
│   │   └── farcaster.json/    # Mini App manifest
│   ├── api/
│   │   └── webhook/            # Webhook endpoint
│   ├── layout.tsx              # Root layout with metadata
│   ├── page.tsx                  # Main page
│   └── globals.css              # Global styles
├── components/
│   ├── FlappyBirdGame.tsx      # Main game component
│   └── FlappyBirdGame.module.css # Game styles
├── public/                       # Static assets
└── package.json
```

## Game Controls

- **Space** or **Click/Touch** - Jump/Start game
- **B** - Open/Close settings (when not playing)

## Customization

### Adding New Themes

Edit `THEMES` object in `components/FlappyBirdGame.tsx`:

```typescript
const THEMES: Record<string, Theme> = {
  // ... existing themes
  newTheme: {
    name: 'New Theme',
    pipeColor: '#color',
    pipeCapColor: '#color',
    skyGradient: 'linear-gradient(...)',
    groundColor: '#color',
    grassColor: '#color',
  },
}
```

### Adding New Skins

Edit `SKINS` object in `components/FlappyBirdGame.tsx`:

```typescript
const SKINS: Record<string, Skin> = {
  // ... existing skins
  newSkin: {
    name: 'New Skin',
    body: '#color',
    outline: '#color',
    wing: '#color',
  },
}
```

## Resources

- [Base Docs - Mini Apps](https://docs.base.org/mini-apps/introduction/overview)
- [Farcaster MiniApp SDK](https://github.com/farcasterxyz/miniapp-sdk)
- [Base Build Preview Tool](https://www.base.dev/preview)

## License

MIT

## Contributing

Contributions welcome! Feel free to open issues or submit pull requests.


