import { useEffect, useRef, useState } from 'react'

interface TimerProps {
  totalSeconds: number
  onTimeout: () => void
  paused?: boolean
}

export default function Timer({ totalSeconds, onTimeout, paused = false }: TimerProps) {
  const [remaining, setRemaining] = useState(totalSeconds)
  const onTimeoutRef = useRef(onTimeout)
  const firedRef = useRef(false)

  useEffect(() => {
    onTimeoutRef.current = onTimeout
  }, [onTimeout])

  useEffect(() => {
    setRemaining(totalSeconds)
    firedRef.current = false
  }, [totalSeconds])

  useEffect(() => {
    if (paused) return
    if (remaining <= 0) {
      if (!firedRef.current) {
        firedRef.current = true
        onTimeoutRef.current()
      }
      return
    }
    const id = setTimeout(() => setRemaining((r) => r - 1), 1000)
    return () => clearTimeout(id)
  }, [remaining, paused])

  const pct = remaining / totalSeconds
  const radius = 36
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * (1 - pct)

  let color = '#22C55E'
  let textColor = 'text-green-500'
  if (pct <= 0.5 && pct > 0.1) {
    color = '#EAB308'
    textColor = 'text-yellow-500'
  } else if (pct <= 0.1) {
    color = '#EF4444'
    textColor = 'text-red-500'
  }

  const isUrgent = pct <= 0.1

  return (
    <div className={`relative w-20 h-20 flex items-center justify-center ${isUrgent ? 'timer-shake timer-pulse rounded-full' : ''}`}>
      <svg className="absolute inset-0 -rotate-90" width="80" height="80">
        <circle cx="40" cy="40" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="6" />
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }}
        />
      </svg>
      <span className={`text-xl font-bold ${textColor} z-10`}>{remaining}</span>
    </div>
  )
}
