import { useCallback, useEffect, useRef, useState } from 'react'
import './App.css'

const NAME = 'Bhuvana'

const photos = [
  { src: '/images/4.jpeg', caption: 'Where it all began — little us 💛', tilt: 2, zoom: 0 },
  { src: '/images/1.jpeg', caption: 'That smile lights up every room ✨', tilt: -4, zoom: 0 },
  { src: '/images/2.jpeg', caption: 'Pretty in blue, always 💙', tilt: 3, zoom: 0 },
  { src: '/images/3.jpeg', caption: 'Partners in crime since forever 👫', tilt: -2, zoom: 1.32 },
]

const wishes = [
  'May your year be as bright as your smile.',
  'May every dream you chase come running back to you.',
  'May you always find reasons to laugh out loud.',
  'May you know how loved you are — today and every day.',
]

const reasons = [
  { icon: '😄', title: 'Your laugh', text: 'It’s contagious. One giggle and the whole house joins in.' },
  { icon: '🛡️', title: 'You’ve got my back', text: 'No matter what, you’re in my corner — always.' },
  { icon: '🌸', title: 'Your kind heart', text: 'You care for everyone around you without being asked.' },
  { icon: '💪', title: 'So strong', text: 'You face every challenge with courage and a smile.' },
]

/* ---------- Confetti ---------- */
type Piece = { x: number; y: number; vx: number; vy: number; r: number; c: string; rot: number; vr: number; life: number; heart: boolean }
const COLORS = ['#1e9bd7', '#f4c542', '#ff8fab', '#7ed6df', '#ffffff', '#c084fc']

function drawHeart(ctx: CanvasRenderingContext2D, s: number) {
  ctx.beginPath()
  ctx.moveTo(0, s * 0.3)
  ctx.bezierCurveTo(-s, -s * 0.4, -s * 0.4, -s, 0, -s * 0.4)
  ctx.bezierCurveTo(s * 0.4, -s, s, -s * 0.4, 0, s * 0.3)
  ctx.fill()
}

function useConfetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pieces = useRef<Piece[]>([])
  const running = useRef(false)

  const loop = useCallback(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')!
    ctx.clearRect(0, 0, cv.width, cv.height)
    pieces.current = pieces.current.filter((p) => p.life > 0 && p.y < cv.height + 40)
    for (const p of pieces.current) {
      p.vy += 0.18
      p.vx *= 0.99
      p.x += p.vx
      p.y += p.vy
      p.rot += p.vr
      p.life -= 1
      ctx.save()
      ctx.globalAlpha = Math.min(1, p.life / 60)
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rot)
      ctx.fillStyle = p.c
      if (p.heart) drawHeart(ctx, p.r * 0.9)
      else ctx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2)
      ctx.restore()
    }
    if (pieces.current.length) requestAnimationFrame(loop)
    else running.current = false
  }, [])

  const burst = useCallback(
    (x = window.innerWidth / 2, y = window.innerHeight / 3, n = 160) => {
      const cv = canvasRef.current
      if (!cv) return
      if (cv.width !== window.innerWidth) cv.width = window.innerWidth
      if (cv.height !== window.innerHeight) cv.height = window.innerHeight
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2
        const s = 4 + Math.random() * 9
        pieces.current.push({
          x, y,
          vx: Math.cos(a) * s,
          vy: Math.sin(a) * s - 6,
          r: 6 + Math.random() * 8,
          c: COLORS[(Math.random() * COLORS.length) | 0],
          rot: Math.random() * 6,
          vr: (Math.random() - 0.5) * 0.4,
          life: 220 + Math.random() * 80,
          heart: Math.random() < 0.2,
        })
      }
      if (!running.current) {
        running.current = true
        requestAnimationFrame(loop)
      }
    },
    [loop],
  )

  return { canvasRef, burst }
}

/* ---------- Music: "Happy Birthday" as a music box ---------- */
const N: Record<string, number> = { G4: 392, A4: 440, B4: 493.88, C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99 }
const SONG: [string, number][] = [
  ['G4', 0.75], ['G4', 0.25], ['A4', 1], ['G4', 1], ['C5', 1], ['B4', 2],
  ['G4', 0.75], ['G4', 0.25], ['A4', 1], ['G4', 1], ['D5', 1], ['C5', 2],
  ['G4', 0.75], ['G4', 0.25], ['G5', 1], ['E5', 1], ['C5', 1], ['B4', 1], ['A4', 2],
  ['F5', 0.75], ['F5', 0.25], ['E5', 1], ['C5', 1], ['D5', 1], ['C5', 3],
]
const BEAT = 0.42

function useMusic() {
  const ctxRef = useRef<AudioContext | null>(null)
  const timer = useRef<number | undefined>(undefined)
  const [playing, setPlaying] = useState(false)

  const playOnce = useCallback(() => {
    const ctx = ctxRef.current
    if (!ctx) return
    let t = ctx.currentTime + 0.1
    for (const [note, beats] of SONG) {
      const f = N[note]
      for (const [mult, vol] of [[1, 0.18], [2, 0.05], [3, 0.02]] as const) {
        const osc = ctx.createOscillator()
        const g = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.value = f * mult
        g.gain.setValueAtTime(0, t)
        g.gain.linearRampToValueAtTime(vol, t + 0.01)
        g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(0.6, beats * BEAT * 1.6))
        osc.connect(g).connect(ctx.destination)
        osc.start(t)
        osc.stop(t + beats * BEAT * 1.8 + 0.2)
      }
      t += beats * BEAT
    }
    const total = SONG.reduce((s, [, b]) => s + b, 0) * BEAT
    timer.current = window.setTimeout(playOnce, (total + 2.5) * 1000)
  }, [])

  const start = useCallback(() => {
    if (!ctxRef.current) ctxRef.current = new AudioContext()
    ctxRef.current.resume()
    clearTimeout(timer.current)
    playOnce()
    setPlaying(true)
  }, [playOnce])

  const stop = useCallback(() => {
    clearTimeout(timer.current)
    ctxRef.current?.close()
    ctxRef.current = null
    setPlaying(false)
  }, [])

  useEffect(() => () => clearTimeout(timer.current), [])

  return { playing, start, stop }
}

/* ---------- Pieces ---------- */
function Balloons() {
  const list = Array.from({ length: 12 }, (_, i) => ({
    left: (i * 83) % 100,
    delay: (i * 1.7) % 12,
    dur: 12 + ((i * 3) % 8),
    color: COLORS[i % 4],
    size: 40 + ((i * 7) % 26),
  }))
  return (
    <div className="balloons" aria-hidden>
      {list.map((b, i) => (
        <span
          key={i}
          className="balloon"
          style={{
            left: `${b.left}%`,
            animationDelay: `${b.delay}s`,
            animationDuration: `${b.dur}s`,
            background: b.color,
            width: b.size,
            height: b.size * 1.2,
          }}
        />
      ))}
    </div>
  )
}

function Cake({ onAllOut }: { onAllOut: () => void }) {
  const [lit, setLit] = useState([true, true, true])
  const done = lit.every((v) => !v)
  const celebrated = useRef(false)
  useEffect(() => {
    if (done && !celebrated.current) {
      celebrated.current = true
      onAllOut()
    }
  }, [done, onAllOut])
  const blow = (i: number) => setLit((prev) => prev.map((v, j) => (j === i ? false : v)))
  const relight = () => {
    celebrated.current = false
    setLit([true, true, true])
  }
  return (
    <div className="cake-wrap">
      <div className="cake">
        <div className="candles">
          {lit.map((on, i) => (
            <button key={i} className="candle" onClick={() => blow(i)} aria-label={on ? 'Blow out candle' : 'Candle out'}>
              <span className={`flame ${on ? '' : 'out'}`} />
              {!on && <span className="smoke" />}
            </button>
          ))}
        </div>
        <div className="tier top" />
        <div className="tier bottom" />
        <div className="plate" />
      </div>
      <p className="cake-hint">
        {done ? '🎉 Wish made! It’s on its way to you 🎉' : 'Close your eyes, make a wish & tap the candles to blow them out'}
      </p>
      {done && (
        <button className="link-btn" onClick={relight}>Light them again 🕯️</button>
      )}
    </div>
  )
}

function Lightbox({ index, onClose, onMove }: { index: number; onClose: () => void; onMove: (d: number) => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') onMove(1)
      if (e.key === 'ArrowLeft') onMove(-1)
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose, onMove])
  const p = photos[index]
  return (
    <div className="lightbox" onClick={onClose} role="dialog" aria-modal="true">
      <button className="lb-close" onClick={onClose} aria-label="Close">×</button>
      <button className="lb-nav prev" onClick={(e) => { e.stopPropagation(); onMove(-1) }} aria-label="Previous photo">‹</button>
      <figure className="lb-figure" onClick={(e) => e.stopPropagation()} key={index}>
        <img src={p.src} alt={p.caption} />
        <figcaption>{p.caption}</figcaption>
      </figure>
      <button className="lb-nav next" onClick={(e) => { e.stopPropagation(); onMove(1) }} aria-label="Next photo">›</button>
    </div>
  )
}

function useReveal(active: boolean) {
  useEffect(() => {
    if (!active) return
    const els = document.querySelectorAll('.reveal')
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add('show')),
      { threshold: 0.12 },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [active])
}

/* ---------- App ---------- */
export default function App() {
  const [stage, setStage] = useState<'gift' | 'opening' | 'open'>('gift')
  const [wishIdx, setWishIdx] = useState(0)
  const [lightbox, setLightbox] = useState<number | null>(null)
  const [letterOpen, setLetterOpen] = useState(false)
  const { canvasRef, burst } = useConfetti()
  const music = useMusic()
  const opened = stage === 'open'
  useReveal(opened)

  useEffect(() => {
    if (!opened) return
    const t = setInterval(() => setWishIdx((i) => (i + 1) % wishes.length), 3800)
    return () => clearInterval(t)
  }, [opened])

  const open = () => {
    if (stage !== 'gift') return
    setStage('opening')
    music.start()
    setTimeout(() => {
      setStage('open')
      burst(window.innerWidth / 2, window.innerHeight / 2, 240)
    }, 900)
  }

  const fireworks = () => {
    const w = window.innerWidth
    const h = window.innerHeight
    ;[[0.25, 0.35], [0.75, 0.3], [0.5, 0.2], [0.35, 0.5], [0.65, 0.5]].forEach(([x, y], i) =>
      setTimeout(() => burst(w * x, h * y, 120), i * 280),
    )
  }

  const moveLightbox = useCallback(
    (d: number) => setLightbox((i) => (i === null ? i : (i + d + photos.length) % photos.length)),
    [],
  )
  const closeLightbox = useCallback(() => setLightbox(null), [])
  const onCakeOut = useCallback(() => burst(window.innerWidth / 2, window.innerHeight / 2, 260), [burst])

  return (
    <>
      <canvas ref={canvasRef} className="confetti" />

      {stage !== 'open' && (
        <div className={`gift-screen ${stage === 'opening' ? 'opening' : ''}`}>
          <p className="gift-label">A little surprise for</p>
          <h2 className="gift-name">{NAME}</h2>
          <button className="gift" onClick={open} aria-label="Open the gift">
            <span className="glow" />
            <span className="lid"><span className="bow" /></span>
            <span className="box" />
          </button>
          <p className="gift-tap">tap the gift 🎁 <span>(sound on 🔊)</span></p>
        </div>
      )}

      {opened && (
        <main>
          <Balloons />

          <button
            className={`music-btn ${music.playing ? 'on' : ''}`}
            onClick={music.playing ? music.stop : music.start}
            aria-label={music.playing ? 'Pause music' : 'Play music'}
          >
            <span className="eq" aria-hidden><i /><i /><i /></span>
            {music.playing ? 'Music on' : 'Play music'}
          </button>

          <section className="hero">
            <div className="hero-photo">
              <div className="ring" aria-hidden />
              <img src={photos[1].src} alt={NAME} />
              <span className="sparkle s1">✦</span>
              <span className="sparkle s2">✦</span>
              <span className="sparkle s3">✧</span>
              <span className="badge">🎂 Birthday Girl</span>
            </div>
            <div className="hero-text">
              <p className="eyebrow">Today is all about you</p>
              <h1>
                <span className="hb">Happy Birthday</span>
                <span className="name" aria-label={NAME}>
                  {NAME.split('').map((ch, i) => (
                    <span key={i} aria-hidden style={{ animationDelay: `${0.4 + i * 0.09}s` }}>{ch}</span>
                  ))}
                </span>
              </h1>
              <p className="rotating" key={wishIdx}>{wishes[wishIdx]}</p>
              <div className="hero-actions">
                <button className="btn" onClick={() => burst()}>Throw confetti 🎊</button>
                <a className="btn ghost" href="#wish">Make a wish ↓</a>
              </div>
            </div>
            <a href="#wish" className="scroll-cue" aria-label="Scroll down"><span /></a>
          </section>

          <section id="wish" className="cake-section reveal">
            <p className="kicker">Step one</p>
            <h2 className="section-title">Make a wish</h2>
            <Cake onAllOut={onCakeOut} />
          </section>

          <section className="reasons-section reveal">
            <p className="kicker">Just a few of them</p>
            <h2 className="section-title">Why you’re the best</h2>
            <div className="reasons">
              {reasons.map((r, i) => (
                <div key={i} className="reason" style={{ transitionDelay: `${i * 0.1}s` }}>
                  <span className="reason-icon">{r.icon}</span>
                  <h3>{r.title}</h3>
                  <p>{r.text}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="gallery-section reveal">
            <p className="kicker">Then &amp; now</p>
            <h2 className="section-title">Moments with you</h2>
            <div className="gallery">
              {photos.map((p, i) => (
                <button
                  key={i}
                  className="polaroid"
                  style={{ ['--tilt' as string]: `${p.tilt}deg` }}
                  onClick={() => setLightbox(i)}
                  aria-label={`Open photo: ${p.caption}`}
                >
                  <span className="tape" aria-hidden />
                  <span className="frame">
                    <img src={p.src} alt="" loading="lazy" style={p.zoom ? { transform: `scale(${p.zoom})` } : undefined} />
                  </span>
                  <span className="caption">{p.caption}</span>
                </button>
              ))}
            </div>
            <p className="gallery-hint">Tap a photo to see it bigger</p>
          </section>

          <section className="letter-section reveal">
            <p className="kicker">From my heart</p>
            <h2 className="section-title">A letter for you</h2>
            {!letterOpen ? (
              <button className="envelope" onClick={() => setLetterOpen(true)} aria-label="Open the letter">
                <span className="env-back" />
                <span className="env-flap" />
                <span className="env-seal">💙</span>
                <span className="env-front" />
                <span className="env-label">Tap to open</span>
              </button>
            ) : (
              <div className="letter">
                <p className="letter-hi">Dear {NAME},</p>
                <p>
                  Happy birthday to the best sister anyone could ask for! You’ve been my friend, my
                  cheerleader, and sometimes my strictest teacher. Thank you for every laugh, every
                  fight we got over in five minutes, and every time you had my back.
                </p>
                <p>
                  I hope this year brings you everything that makes you smile — good health, big
                  wins, peaceful days and lots of sweets. Never stop being you.
                </p>
                <p className="letter-sign">With all my love,<br />Your brother 💙</p>
              </div>
            )}
          </section>

          <section className="finale reveal">
            <h2>Here’s to you, {NAME} 🥂</h2>
            <p>Another year older, another year more amazing.</p>
            <button className="btn big" onClick={fireworks}>Celebrate once more 🎆</button>
          </section>

          <footer>
            <p>Made with 💙 for {NAME}</p>
          </footer>

          {lightbox !== null && <Lightbox index={lightbox} onClose={closeLightbox} onMove={moveLightbox} />}
        </main>
      )}
    </>
  )
}
