import { useEffect, useRef, useState } from 'react'

export default function WelcomeOverlay() {
  const [phase, setPhase] = useState('hidden') // hidden → reveal → visible → fading → gone
  const [particlePositions] = useState(() =>
    Array.from({ length: 22 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 2 + Math.random() * 4,
      duration: 3 + Math.random() * 4,
      delay: Math.random() * 3,
      opacity: 0.3 + Math.random() * 0.5,
    }))
  )

  useEffect(() => {
    // Start reveal after a very short delay
    const t1 = setTimeout(() => setPhase('reveal'), 300)
    const t2 = setTimeout(() => setPhase('visible'), 1200)
    // Fade out after 5 seconds of being visible
    const t3 = setTimeout(() => setPhase('fading'), 5500)
    const t4 = setTimeout(() => setPhase('gone'), 7200)
    return () => [t1, t2, t3, t4].forEach(clearTimeout)
  }, [])

  if (phase === 'gone') return null

  return (
    <div
      className={`welcome-overlay ${phase}`}
      onClick={() => {
        if (phase === 'visible' || phase === 'reveal') {
          setPhase('fading')
          setTimeout(() => setPhase('gone'), 1500)
        }
      }}
      style={{ cursor: phase === 'visible' ? 'pointer' : 'default' }}
    >
      {/* Floating ambient particles */}
      {particlePositions.map((p, i) => (
        <div
          key={i}
          className="welcome-particle"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            opacity: p.opacity,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}

      {/* Central content */}
      <div className="welcome-content">
        {/* Decorative wave lines */}
        <div className="welcome-wave-top">
          <svg viewBox="0 0 300 20" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <path d="M0,10 Q37.5,0 75,10 Q112.5,20 150,10 Q187.5,0 225,10 Q262.5,20 300,10" fill="none" stroke="rgba(0,229,255,0.5)" strokeWidth="1.5" />
          </svg>
        </div>

        <p className="welcome-sub-top">~ Deep Sea Portfolio ~</p>

        <h1 className="welcome-title">
          <span className="welcome-word w1">Welcome</span>
          <span className="welcome-word w2"> to </span>
          <span className="welcome-word w3">My</span>
          <br />
          <span className="welcome-word w4 welcome-portfolio">Portfolio</span>
        </h1>

        <div className="welcome-divider">
          <span className="welcome-divider-line" />
          <span className="welcome-divider-icon">🌊</span>
          <span className="welcome-divider-line" />
        </div>

        <p className="welcome-tagline">Scroll down to explore the aquatic world</p>

        <div className="welcome-cta">
          <span className="welcome-cta-dot" />
          <span className="welcome-cta-text">Click anywhere to dive in</span>
          <span className="welcome-cta-dot" />
        </div>

        {/* Decorative wave lines bottom */}
        <div className="welcome-wave-bottom">
          <svg viewBox="0 0 300 20" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <path d="M0,10 Q37.5,20 75,10 Q112.5,0 150,10 Q187.5,20 225,10 Q262.5,0 300,10" fill="none" stroke="rgba(0,229,255,0.5)" strokeWidth="1.5" />
          </svg>
        </div>
      </div>
    </div>
  )
}
