import { useEffect, useState, useMemo } from 'react'

// Seeded random for deterministic positions
const rand = (seed) => {
  const x = Math.sin(seed + 1) * 43758.5453
  return x - Math.floor(x)
}

export default function BubbleIntro() {
  // phases: 'filling' → 'rising' → 'done'
  const [phase, setPhase] = useState('filling')

  useEffect(() => {
    // Start rising after bubbles have settled (1.2s)
    const t1 = setTimeout(() => setPhase('rising'), 1200)
    // Fully unmount after rise animation completes (~3s total)
    const t2 = setTimeout(() => setPhase('done'), 4000)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  // Generate 90 bubbles with deterministic sizes/positions/delays
  const bubbles = useMemo(() => Array.from({ length: 90 }, (_, i) => ({
    id: i,
    left: rand(i * 7.1) * 100,           // % across screen
    bottom: rand(i * 3.7) * 110 - 10,    // % from bottom (some start below fold)
    size: 8 + rand(i * 13.9) * 52,       // px diameter (8–60px)
    riseDelay: rand(i * 5.3) * 0.8,      // stagger the rise start
    riseDuration: 1.4 + rand(i * 2.6) * 1.4, // how fast each rises
    fillDelay: rand(i * 9.1) * 0.9,      // stagger the initial pop-in
    opacity: 0.25 + rand(i * 4.2) * 0.45,
    wobble: (rand(i * 6.5) - 0.5) * 60, // slight horizontal drift during rise
  })), [])

  if (phase === 'done') return null

  return (
    <div className={`bubble-intro bubble-intro--${phase}`} aria-hidden="true">
      {bubbles.map(b => (
        <div
          key={b.id}
          className="bi-bubble"
          style={{
            left: `${b.left}%`,
            bottom: `${b.bottom}%`,
            width: `${b.size}px`,
            height: `${b.size}px`,
            opacity: phase === 'filling' ? b.opacity : 0,
            '--rise-delay': `${b.riseDelay}s`,
            '--rise-duration': `${b.riseDuration}s`,
            '--fill-delay': `${b.fillDelay}s`,
            '--wobble': `${b.wobble}px`,
            transition: phase === 'rising'
              ? `transform ${b.riseDuration}s ${b.riseDelay}s cubic-bezier(0.2,0.8,0.4,1), opacity ${b.riseDuration * 0.7}s ${b.riseDelay}s ease-out`
              : `opacity 0.4s ${b.fillDelay}s ease-out`,
            transform: phase === 'rising'
              ? `translateY(-130vh) translateX(${b.wobble}px)`
              : 'translateY(0) translateX(0)',
          }}
        />
      ))}
    </div>
  )
}
