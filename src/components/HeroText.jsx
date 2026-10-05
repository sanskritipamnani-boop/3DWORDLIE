import { useState, useEffect, useRef } from 'react'

export default function HeroText() {
  const [fadeIn, setFadeIn] = useState(false)
  const [scrollOpacity, setScrollOpacity] = useState(1)
  const [visible, setVisible] = useState(true)
  const scrollAmount = useRef(0)

  // Smooth fade-in on mount
  useEffect(() => {
    const timer = setTimeout(() => setFadeIn(true), 400)
    return () => clearTimeout(timer)
  }, [])

  // Gradual fade-out on wheel scroll
  useEffect(() => {
    const handleWheel = (e) => {
      scrollAmount.current += Math.abs(e.deltaY)
      const fade = Math.max(0, 1 - scrollAmount.current / 400)
      setScrollOpacity(fade)
      if (fade <= 0) setVisible(false)
    }
    window.addEventListener('wheel', handleWheel, { passive: true })
    return () => window.removeEventListener('wheel', handleWheel)
  }, [])

  if (!visible) return null

  const combinedOpacity = fadeIn ? scrollOpacity : 0

  return (
    <div className="hero-overlay" style={{ opacity: combinedOpacity }}>
      {/* Tiny floating sparkles around the text */}
      <div className="hero-sparkles">
        {Array.from({ length: 12 }).map((_, i) => (
          <span
            key={i}
            className="hero-sparkle"
            style={{
              '--delay': `${i * 0.6}s`,
              '--x': `${(Math.random() - 0.5) * 280}px`,
              '--y': `${(Math.random() - 0.5) * 160}px`,
              '--size': `${2 + Math.random() * 3}px`,
              '--dur': `${3 + Math.random() * 4}s`,
            }}
          />
        ))}
      </div>

      <div className="hero-text-group">
        <span className="hero-welcome">Welcome to</span>
        <span className="hero-name">Sanskriti's World</span>
        <span className="hero-sub">✦ scroll to explore ✦</span>
      </div>
    </div>
  )
}
