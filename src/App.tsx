import { useEffect, useRef, useState } from 'react'
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

/* ---------- Confetti ---------- */
type Piece = { x: number; y: number; vx: number; vy: number; r: number; c: string; rot: number; vr: number; life: number }
const COLORS = ['#1e9bd7', '#f4c542', '#ff8fab', '#7ed6df', '#ffffff', '#c084fc']

function useConfetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pieces = useRef<Piece[]>([])
  const running = useRef(false)

  const loop = () => {
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
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rot)
      ctx.fillStyle = p.c
      ctx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2)
      ctx.restore()
    }
    if (pieces.current.length) requestAnimationFrame(loop)
    else running.current = false
  }

  const burst = (x = window.innerWidth / 2, y = window.innerHeight / 3, n = 160) => {
    const cv = canvasRef.current
    if (!cv) return
    cv.width = window.innerWidth
    cv.height = window.innerHeight
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
      })
    }
    if (!running.current) {
      running.current = true
      requestAnimationFrame(loop)
    }
  }

  return { canvasRef, burst }
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
    </div>
  )
}

function useReveal(active: boolean) {
  useEffect(() => {
    if (!active) return
    const els = document.querySelectorAll('.reveal')
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add('show')),
      { threshold: 0.15 },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [active])
}

/* ---------- App ---------- */
export default function App() {
  const [opened, setOpened] = useState(false)
  const [wishIdx, setWishIdx] = useState(0)
  const { canvasRef, burst } = useConfetti()
  useReveal(opened)

  useEffect(() => {
    if (!opened) return
    const t = setInterval(() => setWishIdx((i) => (i + 1) % wishes.length), 3500)
    return () => clearInterval(t)
  }, [opened])

  const open = () => {
    setOpened(true)
    setTimeout(() => burst(window.innerWidth / 2, window.innerHeight / 2, 220), 150)
  }

  return (
    <>
      <canvas ref={canvasRef} className="confetti" />

      {!opened && (
        <div className="gift-screen">
          <p className="gift-label">A little surprise for</p>
          <h2 className="gift-name">{NAME}</h2>
          <button className="gift" onClick={open} aria-label="Open the gift">
            <span className="lid"><span className="bow" /></span>
            <span className="box" />
          </button>
          <p className="gift-tap">tap the gift 🎁</p>
        </div>
      )}

      {opened && (
        <main>
          <Balloons />

          <section className="hero">
            <div className="hero-photo">
              <img src={photos[1].src} alt={NAME} />
              <span className="sparkle s1">✦</span>
              <span className="sparkle s2">✦</span>
              <span className="sparkle s3">✧</span>
            </div>
            <div className="hero-text">
              <p className="eyebrow">Today is all about you</p>
              <h1>
                Happy Birthday
                <span className="name">{NAME}</span>
              </h1>
              <p className="rotating" key={wishIdx}>{wishes[wishIdx]}</p>
              <button className="btn" onClick={() => burst()}>Throw confetti 🎊</button>
            </div>
          </section>

          <section className="cake-section reveal">
            <h2 className="section-title">Make a wish</h2>
            <Cake onAllOut={() => burst(window.innerWidth / 2, window.innerHeight / 2, 260)} />
          </section>

          <section className="gallery-section reveal">
            <h2 className="section-title">Moments with you</h2>
            <div className="gallery">
              {photos.map((p, i) => (
                <figure key={i} className="polaroid" style={{ ['--tilt' as string]: `${p.tilt}deg` }}>
                  <div className="frame">
                    <img src={p.src} alt={p.caption} loading="lazy" style={p.zoom ? { transform: `scale(${p.zoom})` } : undefined} />
                  </div>
                  <figcaption>{p.caption}</figcaption>
                </figure>
              ))}
            </div>
          </section>

          <section className="letter-section reveal">
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
          </section>

          <footer>
            <p>Made with 💙 for {NAME}</p>
          </footer>
        </main>
      )}
    </>
  )
}
