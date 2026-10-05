import { useState, useEffect } from 'react'
import { useProgress } from '@react-three/drei'

export default function LoadingScreen() {
  const { progress, active } = useProgress()
  const [displayProgress, setDisplayProgress] = useState(0)
  const [isDone, setIsDone] = useState(false)
  const [visible, setVisible] = useState(true)

  // Smoothly interpolate progress number
  useEffect(() => {
    const timer = setInterval(() => {
      setDisplayProgress((prev) => {
        if (prev < progress) {
          return Math.min(progress, prev + 2)
        }
        return prev
      })
    }, 20)
    return () => clearInterval(timer)
  }, [progress])

  useEffect(() => {
    if (progress >= 100 && !active) {
      const t1 = setTimeout(() => setIsDone(true), 600)
      const t2 = setTimeout(() => setVisible(false), 1400)
      return () => {
        clearTimeout(t1)
        clearTimeout(t2)
      }
    }
  }, [progress, active])

  if (!visible) return null

  const currentPercent = Math.round(displayProgress)

  return (
    <div className={`doodle-loader-overlay ${isDone ? 'fade-out' : ''}`}>
      <div className="doodle-loader-card">
        {/* User's Doodled Fish Artwork Banner */}
        <div className="doodle-art-banner">
          <img
            src="/doodle_fish.png"
            alt="Doodle Fish"
            className="doodle-art-img"
          />
        </div>

        {/* Animated Swimming Doodled Fish Progress Track */}
        <div className="doodle-track-container">
          <div
            className="doodle-fish-wrapper"
            style={{ left: `${Math.max(4, Math.min(94, currentPercent))}%` }}
          >
            {/* Cute Doodled Swimming Fish SVG matching doodle art */}
            <svg
              className="doodle-fish-svg"
              viewBox="0 0 80 50"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Fish Body */}
              <path
                d="M15 25 C 25 10, 55 10, 68 25 C 55 40, 25 40, 15 25 Z"
                fill="#f97316"
                stroke="#c2410c"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Tail Fin */}
              <path
                d="M15 25 L 2 13 C 6 22, 6 28, 2 37 Z"
                fill="#ea580c"
                stroke="#c2410c"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Eye */}
              <circle cx="58" cy="22" r="3.2" fill="#0f172a" />
              {/* Squiggly Scales */}
              <path
                d="M32 18 Q 36 21 32 25 Q 36 29 32 33"
                stroke="#fde047"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <path
                d="M44 16 Q 48 21 44 25 Q 48 29 44 34"
                stroke="#fde047"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <path
                d="M54 20 Q 57 23 54 26 Q 57 29 54 32"
                stroke="#fde047"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>

            {/* Little trailing doodle bubbles */}
            <div className="doodle-bubbles">
              <span className="bubble b1"></span>
              <span className="bubble b2"></span>
              <span className="bubble b3"></span>
            </div>
          </div>

          {/* Doodled Progress Track Line */}
          <div className="doodle-progress-track">
            <div
              className="doodle-progress-fill"
              style={{ width: `${currentPercent}%` }}
            />
          </div>
        </div>

        {/* Status Percentage Badge */}
        <div className="doodle-percent-text">
          <span>{currentPercent}%</span>
        </div>

        {/* Custom Text in Ocean Navy */}
        <h2 className="doodle-title">
          You have almost reached my world...
        </h2>
        <p className="doodle-subtitle">
          ✦ preparing the aquarium & evening lights ✦
        </p>
      </div>
    </div>
  )
}
