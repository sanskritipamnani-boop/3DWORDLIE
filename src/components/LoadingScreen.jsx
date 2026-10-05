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
        {/* Animated Swimming Doodled Fish */}
        <div className="doodle-track-container">
          <div
            className="doodle-fish-wrapper"
            style={{ left: `${Math.max(4, Math.min(94, currentPercent))}%` }}
          >
            {/* Cute Doodled Swimming Fish SVG */}
            <svg
              className="doodle-fish-svg"
              viewBox="0 0 80 50"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Fish Body */}
              <path
                d="M15 25 C 25 10, 55 10, 68 25 C 55 40, 25 40, 15 25 Z"
                fill="#38bdf8"
                stroke="#0369a1"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Tail Fin */}
              <path
                d="M15 25 L 2 13 C 6 22, 6 28, 2 37 Z"
                fill="#0284c7"
                stroke="#0369a1"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Dorsal Fin */}
              <path
                d="M38 14 C 44 6, 52 8, 54 13"
                fill="#0284c7"
                stroke="#0369a1"
                strokeWidth="2"
                strokeLinecap="round"
              />
              {/* Pectoral Fin */}
              <path
                d="M42 27 C 36 34, 46 36, 48 30"
                fill="#0284c7"
                stroke="#0369a1"
                strokeWidth="2"
                strokeLinecap="round"
              />
              {/* Eye */}
              <circle cx="58" cy="22" r="3.5" fill="#ffffff" />
              <circle cx="59.2" cy="22" r="2" fill="#0f172a" />
              <circle cx="60" cy="21.2" r="0.8" fill="#ffffff" />
              {/* Cute Smile */}
              <path
                d="M62 27 Q 65 29 67 27"
                stroke="#0369a1"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              {/* Stripes */}
              <path
                d="M48 16 Q 44 25 48 34"
                stroke="#ffffff"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M34 18 Q 30 25 34 32"
                stroke="#ffffff"
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

        {/* Requested Custom Text */}
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
