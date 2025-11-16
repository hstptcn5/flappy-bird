'use client'

import { useEffect, useRef, useState } from 'react'
import Script from 'next/script'
import styles from './FlappyBirdGame.module.css'
import { sdk } from '@farcaster/miniapp-sdk'

// Types
interface Theme {
  name: string
  pipeColor: string
  pipeCapColor: string
  skyGradient: string
  groundColor: string
  grassColor: string
}

interface SkinColor {
  name: string
  body: string
  outline: string
  wing: string
}

interface Pipe {
  x: number
  width: number
  gapY: number
  gapHeight: number
  passed: boolean
}

interface Cloud {
  x: number
  y: number
  size: number
  speed: number
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  life: number
}

const THEMES: Record<string, Theme> = {
  classic: {
    name: 'Classic',
    pipeColor: '#2ecc71',
    pipeCapColor: '#34495e',
    skyGradient: 'linear-gradient(#4eb5ff, #c0f5ff)',
    groundColor: '#3b2f1e',
    grassColor: '#5bba47',
  },
  lava: {
    name: 'Lava',
    pipeColor: '#e74c3c',
    pipeCapColor: '#c0392b',
    skyGradient: 'linear-gradient(#434343, #222)',
    groundColor: '#78350f',
    grassColor: '#f1c40f',
  },
  ocean: {
    name: 'Ocean',
    pipeColor: '#1abc9c',
    pipeCapColor: '#0e8a74',
    skyGradient: 'linear-gradient(#5dade2, #a9eaf7)',
    groundColor: '#1f2a44',
    grassColor: '#2ecc71',
  },
  sunset: {
    name: 'Sunset',
    pipeColor: '#f39c12',
    pipeCapColor: '#d35400',
    skyGradient: 'linear-gradient(#ff9a9e, #fad0c4)',
    groundColor: '#5d4037',
    grassColor: '#f1c40f',
  },
  neon: {
    name: 'Neon',
    pipeColor: '#e91e63',
    pipeCapColor: '#9c27b0',
    skyGradient: 'linear-gradient(#141e30, #243b55)',
    groundColor: '#0f0f1a',
    grassColor: '#00e676',
  },
  forest: {
    name: 'Forest',
    pipeColor: '#2e7d32',
    pipeCapColor: '#1b5e20',
    skyGradient: 'linear-gradient(#b7e4c7, #74c69d)',
    groundColor: '#3e2f1e',
    grassColor: '#4caf50',
  },
}

// Fallback vector skin if image not available
const DEFAULT_VECTOR_SKIN: SkinColor = { name: 'Default', body: '#f1c40f', outline: '#e67e22', wing: '#e67e22' }

// Image-based skins: expect files in /public named 1.png ... 6.png
const IMAGE_SKIN_KEYS = ['img1','img2','img3','img4','img5','img6'] as const
type ImageSkinKey = typeof IMAGE_SKIN_KEYS[number]

function getImagePathForSkin(key: string): string | null {
  const m = key.match(/^img([1-6])$/)
  if (!m) return null
  return `/${m[1]}.png`
}

export default function FlappyBirdGame() {
  const [userFid, setUserFid] = useState<number | undefined>(undefined)
  // Fetch Farcaster context (fid) if running inside Mini App
  useEffect(() => {
    (async () => {
      try {
        const ctx = (await (sdk as any)?.context?.get?.()) ?? (sdk as any)?.context
        const fid = ctx?.user?.fid
        if (typeof fid === 'number') setUserFid(fid)
      } catch (e) {
        // ignore if not in miniapp
      }
    })()
  }, [])

  const loginWithFarcaster = async () => {
    try {
      setAuthLoading(true)
      const maybeAuth = (sdk as any)?.actions?.authenticate
      if (typeof maybeAuth === 'function') {
        await maybeAuth()
      }
      const ctx = (await (sdk as any)?.context?.get?.()) ?? (sdk as any)?.context
      const fid = ctx?.user?.fid
      if (typeof fid === 'number') setUserFid(fid)
    } catch (e) {
      // ignore
    } finally {
      setAuthLoading(false)
    }
  }
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const scoreOverlayRef = useRef<HTMLDivElement>(null)
  const centerTextRef = useRef<HTMLDivElement>(null)
  const settingsModalRef = useRef<HTMLDivElement>(null)
  const skinGridRef = useRef<HTMLDivElement>(null)
  const themeGridRef = useRef<HTMLDivElement>(null)

  const [currentTheme, setCurrentTheme] = useState<string>('classic')
  const currentThemeRef = useRef<string>('classic')
  const [currentSkin, setCurrentSkin] = useState<string>('img1')
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameOver'>('menu')
  const [score, setScore] = useState(0)
  const [bestScore, setBestScore] = useState(0)
  const [difficultyLevel, setDifficultyLevel] = useState(0)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false)
  const [leaderboard, setLeaderboard] = useState<Array<{ fid: number; score: number }>>([])
  const [authLoading, setAuthLoading] = useState(false)

  // Game state refs (to avoid re-renders)
  const gameStateRef = useRef(gameState)
  const scoreRef = useRef(score)
  const birdYRef = useRef(0)
  const birdVelocityRef = useRef(0)
  const birdRotationRef = useRef(0)
  const wingFlapTimerRef = useRef(0)
  const isFlappingRef = useRef(false)
  const pipesRef = useRef<Pipe[]>([])
  const pipeSpawnTimerRef = useRef(0)
  const pipeSpeedRef = useRef(2.4)
  const gapHeightRef = useRef(150)
  const cloudsRef = useRef<Cloud[]>([
    { x: 50, y: 100, size: 80, speed: 0.5 },
    { x: 200, y: 50, size: 120, speed: 0.7 },
    { x: 350, y: 150, size: 60, speed: 0.6 },
  ])
  const shakeIntensityRef = useRef(0)
  const particlesRef = useRef<Particle[]>([])
  const lastTimeRef = useRef(0)
  const jumpSynthRef = useRef<any>(null)
  const scoreSynthRef = useRef<any>(null)
  const hitNoiseRef = useRef<any>(null)
  const birdImageRef = useRef<HTMLImageElement | null>(null)
  const birdImageLoadedRef = useRef(false)
  const bgImageRef = useRef<HTMLImageElement | null>(null)
  const bgLoadedRef = useRef(false)
  const pipeImageRef = useRef<HTMLImageElement | null>(null)
  const pipeLoadedRef = useRef(false)
  const pipeCapImageRef = useRef<HTMLImageElement | null>(null)
  const pipeCapLoadedRef = useRef(false)
  const groundImageRef = useRef<HTMLImageElement | null>(null)
  const groundLoadedRef = useRef(false)
  const grassImageRef = useRef<HTMLImageElement | null>(null)
  const grassLoadedRef = useRef(false)
  const cloudImageRef = useRef<HTMLImageElement | null>(null)
  const cloudLoadedRef = useRef(false)

  // Constants
  const BIRD_RADIUS = 14
  const BIRD_SPRITE_SCALE = 3.6 // visual size multiplier for image sprite
  const GRAVITY = 0.35
  const JUMP_STRENGTH = -7.5
  const MAX_ROTATION = Math.PI / 4
  const ROTATION_SPEED = 0.06 // mượt hơn
  const BIRD_ROTATION_FACTOR = 0.03 // xoay rất nhẹ theo vận tốc
  const FLAP_AMPLITUDE = 0 // tắt hiệu ứng đập cánh
  const FLAP_FREQUENCY = 8
  const PIPE_WIDTH = 70
  const PIPE_INTERVAL = 1700
  const BASE_PIPE_SPEED = 2.4
  const BASE_GAP_HEIGHT = 150
  const DIFFICULTY_SCORE_STEP = 5
  const SHAKE_DECAY = 0.9
  const SHAKE_MAX = 8
  const PARTICLE_COUNT = 20

  // Initialize audio
  const initAudio = () => {
    if (typeof window !== 'undefined' && (window as any).Tone) {
      try {
        const Tone = (window as any).Tone
        jumpSynthRef.current = new Tone.MembraneSynth({
          pitchDecay: 0.05,
          octaves: 1.5,
          envelope: { attack: 0.001, decay: 0.2, sustain: 0.01, release: 0.05 },
        }).toDestination()

        scoreSynthRef.current = new Tone.PluckSynth({
          attackNoise: 1,
          dampening: 2000,
          resonance: 0.9,
        }).toDestination()

        hitNoiseRef.current = new Tone.NoiseSynth({
          noise: { type: 'white' },
          envelope: { attack: 0.001, decay: 0.2, sustain: 0 },
        }).toDestination()
      } catch (e) {
        console.error('Tone.js initialization failed:', e)
      }
    }
  }

  const playJump = () => {
    if (jumpSynthRef.current) jumpSynthRef.current.triggerAttackRelease('C5', '16n')
  }
  const playScore = () => {
    if (scoreSynthRef.current) scoreSynthRef.current.triggerAttackRelease('G4', 0.1)
  }
  const playHit = () => {
    if (hitNoiseRef.current) hitNoiseRef.current.triggerAttackRelease('4n')
  }

  // Load saved preferences
  useEffect(() => {
    if (typeof window !== 'undefined') {
      let savedTheme = localStorage.getItem('flappyTheme') || 'classic'
      if (!Object.prototype.hasOwnProperty.call(THEMES, savedTheme)) {
        savedTheme = 'classic'
        localStorage.setItem('flappyTheme', 'classic')
      }
      const savedSkin = localStorage.getItem('flappySkin') || 'img1'
      const savedBestScore = localStorage.getItem('flappyBestScore')
      setCurrentTheme(savedTheme)
      setCurrentSkin(savedSkin)
      if (savedBestScore) {
        setBestScore(parseInt(savedBestScore, 10))
      }

      // Load image for current skin if applicable
      const path = getImagePathForSkin(savedSkin)
      if (path) {
        const img = new Image()
        img.onload = () => {
          birdImageRef.current = img
          birdImageLoadedRef.current = true
        }
        img.onerror = () => {
          birdImageLoadedRef.current = false
        }
        img.src = path
      } else {
        birdImageLoadedRef.current = false
      }

      // Preload environment assets
      const load = (src: string, onOk: (img: HTMLImageElement) => void, onFail?: () => void) => {
        const i = new Image()
        i.onload = () => onOk(i)
        i.onerror = () => onFail && onFail()
        i.src = src
      }

      load('/bg_sky.png', (i) => { bgImageRef.current = i; bgLoadedRef.current = true })
      load('/pipe.png', (i) => { pipeImageRef.current = i; pipeLoadedRef.current = true })
      load('/pipe_cap.png', (i) => { pipeCapImageRef.current = i; pipeCapLoadedRef.current = true })
      load('/ground.png', (i) => { groundImageRef.current = i; groundLoadedRef.current = true })
      load('/grass.png', (i) => { grassImageRef.current = i; grassLoadedRef.current = true })
      load('/cloud.png', (i) => { cloudImageRef.current = i; cloudLoadedRef.current = true })
    }
  }, [])

  // Update game state ref when state changes
  useEffect(() => {
    gameStateRef.current = gameState
    scoreRef.current = score
  }, [gameState, score])

  // Keep theme in ref for RAF loop
  useEffect(() => {
    currentThemeRef.current = currentTheme
  }, [currentTheme])

  const applyTheme = (themeKey: string) => {
    setCurrentTheme(themeKey)
    if (typeof window !== 'undefined') {
      localStorage.setItem('flappyTheme', themeKey)
    }
    if (canvasRef.current) {
      canvasRef.current.style.background = THEMES[themeKey].skyGradient
    }
    renderSettings()
  }

  const applySkin = (skinKey: string) => {
    setCurrentSkin(skinKey)
    if (typeof window !== 'undefined') {
      localStorage.setItem('flappySkin', skinKey)
    }
    // Load image if this skin is image-based
    const path = getImagePathForSkin(skinKey)
    if (path) {
      const img = new Image()
      img.onload = () => {
        birdImageRef.current = img
        birdImageLoadedRef.current = true
      }
      img.onerror = () => {
        birdImageLoadedRef.current = false
      }
      img.src = path
    } else {
      birdImageLoadedRef.current = false
    }
    renderSettings()
  }

  const openSettingsModal = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation()
      e.preventDefault()
    }
    if (gameStateRef.current === 'playing') return
    setIsSettingsOpen(true)
    renderSettings()
    updateUIState()
  }

  const closeSettingsModal = () => {
    setIsSettingsOpen(false)
    updateUIState()
  }

  const renderSettings = () => {
    if (skinGridRef.current) {
      skinGridRef.current.innerHTML = IMAGE_SKIN_KEYS.map((key, idx) => {
        const isSelected = key === currentSkin
        const num = idx + 1
        return `
          <div class="${styles.itemCard} ${isSelected ? styles.selected : ''}" onclick="window.applySkin('${key}')">
            <div class="${styles.itemPreview}" style="background: url('/${num}.png') center/cover no-repeat; border-color: white;"></div>
            <span>Skin ${num}</span>
          </div>
        `
      }).join('')
    }

    if (themeGridRef.current) {
      themeGridRef.current.innerHTML = Object.keys(THEMES)
        .map((key) => {
          const theme = THEMES[key]
          const isSelected = key === currentTheme
          return `
            <div class="${styles.itemCard} ${isSelected ? styles.selected : ''}" onclick="window.applyTheme('${key}')">
              <div class="${styles.themePreview}" style="background: ${theme.skyGradient}; border: 3px solid ${theme.pipeColor};"></div>
              <span>${theme.name}</span>
            </div>
          `
        })
        .join('')
    }
  }

  // Expose functions to window for onclick handlers
  useEffect(() => {
    if (typeof window !== 'undefined') {
      ;(window as any).applyTheme = applyTheme
      ;(window as any).applySkin = applySkin
    }
  }, [])

  // Re-render settings when theme or skin changes
  useEffect(() => {
    if (isSettingsOpen) {
      renderSettings()
    }
  }, [currentTheme, currentSkin, isSettingsOpen])

  const resetGame = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const height = canvas.height
    birdYRef.current = height / 2
    birdVelocityRef.current = 0
    birdRotationRef.current = 0
    wingFlapTimerRef.current = 0
    isFlappingRef.current = false

    pipesRef.current = []
    pipeSpawnTimerRef.current = 0

    setScore(0)
    pipeSpeedRef.current = BASE_PIPE_SPEED
    gapHeightRef.current = BASE_GAP_HEIGHT
    setDifficultyLevel(0)

    shakeIntensityRef.current = 0
    particlesRef.current = []

    resizeCanvas()
  }

  const performStartGame = () => {
    closeSettingsModal()
    resetGame()
    setGameState('playing')
    updateUIState()
  }

  const startGame = () => {
    if (typeof window !== 'undefined' && (window as any).Tone) {
      const Tone = (window as any).Tone
      if (Tone.context.state !== 'running') {
        Tone.start()
          .then(() => {
            performStartGame()
          })
          .catch((e: Error) => {
            console.error('Could not start audio context:', e)
            performStartGame()
          })
      } else {
        performStartGame()
      }
    } else {
      performStartGame()
    }
  }

  const gameOver = () => {
    setGameState('gameOver')
    playHit()
    shakeIntensityRef.current = SHAKE_MAX
    createExplosion()
    if (score > bestScore) {
      const newBest = score
      setBestScore(newBest)
      if (typeof window !== 'undefined') {
        localStorage.setItem('flappyBestScore', newBest.toString())
      }
      // Save to Supabase (server) with Farcaster fid if available
      if (userFid) {
        fetch('/api/score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fid: userFid, score: newBest }),
        })
          .then(() => {
            // refresh leaderboard quietly
            void fetchLeaderboard()
          })
          .catch(() => {})
      }
    }
    updateUIState()
  }

  const updateUIState = () => {
    if (!centerTextRef.current) return

    if (isSettingsOpen) {
      centerTextRef.current.innerHTML = ''
      return
    }

    const settingsButtonHTML = `<button class="${styles.settingsButton}" onclick="window.openSettings()">Customize (B)</button>`

    if (gameState === 'menu') {
      centerTextRef.current.innerHTML = `
        FLAPPY MINI<br/>
        <span style="font-size: 0.8em; font-weight: 500;">(Mini project)</span><br/><br/>
        <span style="font-size: 1.1em;">Press <b>Space</b> or <b>Click/Touch</b> to start</span>
        ${settingsButtonHTML}
      `
    } else if (gameState === 'gameOver') {
      const displayedBest = Math.max(bestScore, score)
      let medal = ''
      if (score >= 40) {
        medal = "<span style='color: #4dc2ff;'><b>DIAMOND MEDAL</b> 💎</span>"
      } else if (score >= 30) {
        medal = "<span style='color: gold;'><b>GOLD MEDAL</b> 🥇</span>"
      } else if (score >= 20) {
        medal = "<span style='color: silver;'><b>SILVER MEDAL</b> 🥈</span>"
      } else if (score >= 10) {
        medal = "<span style='color: #cd7f32;'><b>BRONZE MEDAL</b> 🥉</span>"
      }

      centerTextRef.current.innerHTML = `
        GAME OVER<br/>
        <span style="font-size: 1.1em;">${medal}</span><br/>
        <span style="font-size: 1.2em;">Score: ${score}</span> &nbsp;|&nbsp; Best: ${displayedBest}<br/><br/>
        <span style="font-size: 0.8em; font-weight: 500;">Press <b>Space</b> or <b>Click/Touch</b> to retry</span>
        ${settingsButtonHTML}
      `
    } else {
      centerTextRef.current.innerHTML = ''
    }
  }

  useEffect(() => {
    updateUIState()
  }, [gameState, score, bestScore, isSettingsOpen])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      ;(window as any).openSettings = openSettingsModal
    }
  }, [])

  const spawnPipe = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const height = canvas.height
    const minGapY = 80
    const maxGapY = height - 80 - gapHeightRef.current

    if (maxGapY <= minGapY) return

    const gapY = minGapY + Math.random() * (maxGapY - minGapY)

    pipesRef.current.push({
      x: canvas.width + 20,
      width: PIPE_WIDTH,
      gapY: gapY,
      gapHeight: gapHeightRef.current,
      passed: false,
    })
  }

  const createExplosion = () => {
    const skin = DEFAULT_VECTOR_SKIN
    particlesRef.current = []
    const birdX = canvasRef.current ? canvasRef.current.width * 0.3 : 120

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particlesRef.current.push({
        x: birdX,
        y: birdYRef.current,
        vx: Math.random() * 8 - 4,
        vy: Math.random() * -10,
        size: Math.random() * 4 + 2,
        color: i % 2 === 0 ? skin.body : skin.outline,
        life: 500 + Math.random() * 500,
      })
    }
  }

  const resizeCanvas = () => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const width = container.clientWidth
    const height = container.clientHeight

    canvas.width = width
    canvas.height = height

    const theme = THEMES[currentThemeRef.current] || THEMES.classic
    canvas.style.background = theme.skyGradient
  }

  // Drawing functions
  const drawParallax = (ctx: CanvasRenderingContext2D) => {
    const clouds = cloudsRef.current
    if (cloudLoadedRef.current && cloudImageRef.current) {
      for (const cloud of clouds) {
        const w = cloud.size
        const h = cloud.size * 0.6
        ctx.drawImage(cloudImageRef.current, cloud.x - w * 0.5, cloud.y - h * 0.5, w, h)
      }
    } else {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
      for (const cloud of clouds) {
        ctx.beginPath()
        ctx.arc(cloud.x, cloud.y, cloud.size * 0.3, 0, Math.PI * 2)
        ctx.arc(cloud.x + cloud.size * 0.4, cloud.y, cloud.size * 0.4, 0, Math.PI * 2)
        ctx.arc(cloud.x - cloud.size * 0.3, cloud.y + cloud.size * 0.1, cloud.size * 0.35, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }

  const drawBackground = (ctx: CanvasRenderingContext2D) => {
    const theme = THEMES[currentThemeRef.current] || THEMES.classic
    const canvas = canvasRef.current
    if (!canvas) return

    // Sky: revert to gradient
    canvas.style.background = theme.skyGradient

    drawParallax(ctx)

    const groundHeight = 80
    const height = canvas.height

    // Ground: revert to vector
    ctx.fillStyle = theme.groundColor
    ctx.fillRect(0, height - groundHeight, canvas.width, groundHeight)

    // Grass: revert to vector
    ctx.fillStyle = theme.grassColor
    ctx.fillRect(0, height - groundHeight, canvas.width, 10)
  }

  const drawPipes = (ctx: CanvasRenderingContext2D) => {
    const theme = THEMES[currentThemeRef.current] || THEMES.classic
    const canvas = canvasRef.current
    if (!canvas) return

    const height = canvas.height

    for (const pipe of pipesRef.current) {
      // Vector pipes (reverted)
      ctx.fillStyle = theme.pipeColor
      ctx.fillRect(pipe.x, 0, pipe.width, pipe.gapY)
      ctx.fillRect(pipe.x, pipe.gapY + pipe.gapHeight, pipe.width, height - (pipe.gapY + pipe.gapHeight))
      ctx.strokeStyle = 'rgba(0,0,0,0.2)'
      ctx.lineWidth = 3
      ctx.strokeRect(pipe.x, 0, pipe.width, pipe.gapY)
      ctx.strokeRect(pipe.x, pipe.gapY + pipe.gapHeight, pipe.width, height - (pipe.gapY + pipe.gapHeight))

      // Caps
      const capHeight = 30
      const capWidth = pipe.width * 1.1
      const capOffset = (capWidth - pipe.width) / 2
      ctx.fillStyle = theme.pipeCapColor
      ctx.fillRect(pipe.x - capOffset, pipe.gapY - capHeight, capWidth, capHeight)
      ctx.fillRect(pipe.x - capOffset, pipe.gapY + pipe.gapHeight, capWidth, capHeight)
      ctx.strokeStyle = 'rgba(0,0,0,0.3)'
      ctx.lineWidth = 3
      ctx.strokeRect(pipe.x - capOffset, pipe.gapY - capHeight, capWidth, capHeight)
      ctx.strokeRect(pipe.x - capOffset, pipe.gapY + pipe.gapHeight, capWidth, capHeight)
    }
  }

  const drawWing = (ctx: CanvasRenderingContext2D, flapAngle: number, skin: SkinColor) => {
    ctx.save()
    ctx.translate(-BIRD_RADIUS * 0.8, 0)
    ctx.rotate(flapAngle)

    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(-12, -15)
    ctx.lineTo(-12, 10)
    ctx.closePath()
    ctx.fillStyle = skin.wing
    ctx.fill()
    ctx.restore()
  }

  const drawBird = (ctx: CanvasRenderingContext2D) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const birdX = canvas.width * 0.3

    ctx.save()
    ctx.translate(birdX, birdYRef.current)
    // áp dụng quay nhẹ
    ctx.rotate(birdRotationRef.current)

    const autoFlapAngle = 0
    const manualFlap = 0

    if (birdImageLoadedRef.current && birdImageRef.current) {
      // Draw custom image centered at (0,0)
      const size = BIRD_RADIUS * 2 * BIRD_SPRITE_SCALE
      // Ảnh sprite: bỏ hiệu ứng scale để tránh rung
      const scale = 1
      ctx.drawImage(
        birdImageRef.current,
        -size * 0.5 * scale,
        -size * 0.5 * scale,
        size * scale,
        size * scale
      )
    } else {
      // Fallback: vector bird with wing animation
      const skin = DEFAULT_VECTOR_SKIN

      ctx.beginPath()
      ctx.arc(0, 0, BIRD_RADIUS, 0, Math.PI * 2)
      ctx.fillStyle = skin.body
      ctx.fill()

      ctx.strokeStyle = skin.outline
      ctx.lineWidth = 2
      ctx.stroke()

      ctx.beginPath()
      ctx.arc(5, -4, 3, 0, Math.PI * 2)
      ctx.fillStyle = '#fff'
      ctx.fill()

      ctx.beginPath()
      ctx.arc(5, -4, 1.5, 0, Math.PI * 2)
      ctx.fillStyle = '#000'
      ctx.fill()

      ctx.beginPath()
      ctx.moveTo(BIRD_RADIUS, 0)
      ctx.lineTo(BIRD_RADIUS + 8, 4)
      ctx.lineTo(BIRD_RADIUS + 8, -4)
      ctx.closePath()
      ctx.fillStyle = '#e67e22'
      ctx.fill()
    }

    ctx.restore()
  }

  const drawParticles = (ctx: CanvasRenderingContext2D) => {
    for (const p of particlesRef.current) {
      ctx.fillStyle = p.color
      ctx.globalAlpha = p.life / 1000
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1
  }

  const draw = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const shakeX = shakeIntensityRef.current > 0 ? (Math.random() * 2 - 1) * shakeIntensityRef.current : 0
    const shakeY = shakeIntensityRef.current > 0 ? (Math.random() * 2 - 1) * shakeIntensityRef.current : 0

    ctx.save()
    ctx.translate(shakeX, shakeY)

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    drawBackground(ctx)
    drawPipes(ctx)

    if (gameStateRef.current !== 'gameOver' || particlesRef.current.length === 0) {
      drawBird(ctx)
    }

    drawParticles(ctx)

    ctx.fillStyle = 'rgba(255,255,255,0.4)'
    ctx.font = '36px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(scoreRef.current.toString(), canvas.width / 2, 60)

    if (scoreOverlayRef.current) {
      const displayedBest = Math.max(bestScore, scoreRef.current)
      scoreOverlayRef.current.textContent = `Score: ${scoreRef.current} | Best: ${displayedBest} | Level: ${difficultyLevel}`
    }

    ctx.restore()
  }

  const update = (delta: number) => {
    const deltaFactor = delta / 16.67

    if (shakeIntensityRef.current > 0) {
      shakeIntensityRef.current *= SHAKE_DECAY
      if (shakeIntensityRef.current < 0.5) shakeIntensityRef.current = 0
    }

    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
      const p = particlesRef.current[i]
      p.x += p.vx * deltaFactor
      p.y += p.vy * deltaFactor
      p.vy += 0.5 * deltaFactor
      p.life -= delta
      if (p.life <= 0) {
        particlesRef.current.splice(i, 1)
      }
    }

    if (gameStateRef.current !== 'playing') return

    const newDifficultyLevel = Math.floor(scoreRef.current / DIFFICULTY_SCORE_STEP)
    if (newDifficultyLevel > difficultyLevel) {
      setDifficultyLevel(newDifficultyLevel)
      pipeSpeedRef.current = Math.min(BASE_PIPE_SPEED + newDifficultyLevel * 0.2, 4.0)
      gapHeightRef.current = Math.max(BASE_GAP_HEIGHT - newDifficultyLevel * 10, 100)
    }

    birdVelocityRef.current += GRAVITY * deltaFactor
    birdYRef.current += birdVelocityRef.current * deltaFactor

    wingFlapTimerRef.current += delta * 0.01

    // tính góc quay nhẹ dựa vào vận tốc
    const targetRotation = Math.min(
      Math.max(birdVelocityRef.current * BIRD_ROTATION_FACTOR, -MAX_ROTATION / 2),
      MAX_ROTATION / 2
    )
    birdRotationRef.current =
      birdRotationRef.current + (targetRotation - birdRotationRef.current) * ROTATION_SPEED * deltaFactor

    if (isFlappingRef.current && deltaFactor > 0) {
      isFlappingRef.current = false
    }

    const canvas = canvasRef.current
    if (!canvas) return

    if (birdYRef.current - BIRD_RADIUS < 0 || birdYRef.current + BIRD_RADIUS > canvas.height) {
      // khi chạm đất, đặt góc nhẹ xuống dưới
      birdRotationRef.current = MAX_ROTATION / 2
      gameOver()
      return
    }

    for (const cloud of cloudsRef.current) {
      cloud.x -= pipeSpeedRef.current * cloud.speed * deltaFactor
      if (cloud.x + cloud.size < 0) {
        cloud.x = canvas.width + Math.random() * 100
        cloud.y = 50 + Math.random() * (canvas.height / 3)
        cloud.size = 60 + Math.random() * 60
      }
    }

    pipeSpawnTimerRef.current += delta
    if (pipeSpawnTimerRef.current >= PIPE_INTERVAL) {
      spawnPipe()
      pipeSpawnTimerRef.current = 0
    }

    const birdX = canvas.width * 0.3
    for (let i = 0; i < pipesRef.current.length; i++) {
      const pipe = pipesRef.current[i]
      pipe.x -= pipeSpeedRef.current * deltaFactor

      if (!pipe.passed && pipe.x + pipe.width < birdX) {
        pipe.passed = true
        const newScore = scoreRef.current + 1
        setScore(newScore)
        scoreRef.current = newScore
        playScore()
      }
    }

    for (let i = pipesRef.current.length - 1; i >= 0; i--) {
      if (pipesRef.current[i].x + pipesRef.current[i].width < 0) {
        pipesRef.current.splice(i, 1)
      }
    }

    for (const pipe of pipesRef.current) {
      const withinX = birdX + BIRD_RADIUS > pipe.x && birdX - BIRD_RADIUS < pipe.x + pipe.width

      if (withinX) {
        const inGap =
          birdYRef.current - BIRD_RADIUS > pipe.gapY &&
          birdYRef.current + BIRD_RADIUS < pipe.gapY + pipe.gapHeight

        if (!inGap) {
          gameOver()
          return
        }
      }
    }
  }

  const loop = (timestamp: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = timestamp
    const delta = timestamp - lastTimeRef.current
    lastTimeRef.current = timestamp

    const limitedDelta = Math.min(delta, 1000 / 30)

    update(limitedDelta)
    draw()

    requestAnimationFrame(loop)
  }

  const handleInput = () => {
    if (isSettingsOpen) return

    if (gameStateRef.current === 'menu') {
      startGame()
    } else if (gameStateRef.current === 'playing') {
      birdVelocityRef.current = JUMP_STRENGTH
      // đặt một góc nhẹ đi lên khi vừa nhảy
      birdRotationRef.current = -MAX_ROTATION / 2
      isFlappingRef.current = true
      playJump()
    } else if (gameStateRef.current === 'gameOver') {
      startGame()
    }
  }

  // Initialize game
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    resizeCanvas()
    resetGame()
    renderSettings()
    updateUIState()

    const animationId = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(animationId)
    }
  }, [])

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      resizeCanvas()
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [currentTheme])

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault()
        handleInput()
      } else if (e.key.toLowerCase() === 'l') {
        e.preventDefault()
        toggleLeaderboard()
      } else if (e.key.toLowerCase() === 'b') {
        if (gameStateRef.current !== 'playing') {
          e.preventDefault()
          if (isSettingsOpen) {
            closeSettingsModal()
          } else {
            openSettingsModal()
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isSettingsOpen])

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch('/api/score/top')
      const json = await res.json()
      if (Array.isArray(json.top)) {
        setLeaderboard(json.top.map((x: any) => ({ fid: x.fid, score: x.score })))
      }
    } catch {
      // ignore
    }
  }

  const toggleLeaderboard = () => {
    const next = !isLeaderboardOpen
    setIsLeaderboardOpen(next)
    if (next) {
      void fetchLeaderboard()
    }
  }

  // Handle mouse/touch input
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const handleMouseDown = () => handleInput()
    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault()
      handleInput()
    }

    canvas.addEventListener('mousedown', handleMouseDown)
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false })

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown)
      canvas.removeEventListener('touchstart', handleTouchStart)
    }
  }, [isSettingsOpen])

  return (
    <>
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/tone/14.8.49/Tone.min.js"
        onLoad={initAudio}
      />
      <div ref={containerRef} className={styles.gameContainer}>
        <canvas ref={canvasRef} className={styles.canvas} width={400} height={600} />
        <div ref={scoreOverlayRef} className={styles.scoreOverlay}></div>
        <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.4)', padding: '4px 8px', borderRadius: 6, fontSize: 14 }}>
          {userFid ? (
            <span>Connected: fid {userFid}</span>
          ) : (
            <button
              onClick={loginWithFarcaster}
              disabled={authLoading}
              className={styles.settingsButton}
              style={{ margin: 0, padding: '6px 10px' }}
            >
              {authLoading ? 'Connecting…' : 'Login (Farcaster)'}
            </button>
          )}
        </div>
        <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.4)', padding: '4px 8px', borderRadius: 6, fontSize: 14 }}>
          {userFid ? (
            <span>Connected: fid {userFid}</span>
          ) : (
            <button
              onClick={loginWithFarcaster}
              disabled={authLoading}
              className={styles.settingsButton}
              style={{ margin: 0, padding: '6px 10px' }}
            >
              {authLoading ? 'Connecting…' : 'Login (Farcaster)'}
            </button>
          )}
        </div>
        <div ref={centerTextRef} className={styles.centerText}></div>

        <div
          ref={settingsModalRef}
          className={styles.settingsModal}
          style={{ display: isSettingsOpen ? 'flex' : 'none' }}
        >
          <h2 style={{ marginBottom: '20px', fontSize: '2em', color: 'gold' }}>SHOP & SETTINGS</h2>

          <div className={styles.shopSection}>
            <h3>Select Bird Skin</h3>
            <div ref={skinGridRef} className={styles.selectionGrid}></div>
          </div>

          <div className={styles.shopSection}>
            <h3>Select Theme</h3>
            <div ref={themeGridRef} className={styles.selectionGrid}></div>
          </div>

          <button className={styles.settingsButton} onClick={closeSettingsModal} style={{ marginTop: '30px', backgroundColor: '#e74c3c', boxShadow: '0 4px #c0392b' }}>
            CLOSE
          </button>
        </div>

        <div
          className={styles.leaderboardModal}
          style={{ display: isLeaderboardOpen ? 'flex' : 'none' }}
        >
          <div className={styles.leaderboardHeader}>
            <div className={styles.leaderboardTitle}>Leaderboard (Top 10)</div>
          </div>
          <div className={styles.leaderboardList}>
            {leaderboard.length === 0 ? (
              <div style={{ opacity: 0.8, textAlign: 'center' }}>No data yet</div>
            ) : (
              leaderboard.map((row, idx) => (
                <div key={`${row.fid}-${idx}`} className={styles.leaderboardItem}>
                  <div className={styles.rank}>{idx + 1}</div>
                  <div className={styles.fid}>fid: {row.fid}</div>
                  <div>🏆 {row.score}</div>
                </div>
              ))
            )}
          </div>
          <button className={styles.lbClose} onClick={toggleLeaderboard}>CLOSE (L)</button>
        </div>
      </div>
    </>
  )
}

