import React, { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'

export const SessionTimer = ({
  startTime,
  className = '',
}) => {
  const [duration, setDuration] = useState('00:00:00')

  useEffect(() => {
    const start = new Date(startTime).getTime()

    const updateTimer = () => {
      const now = new Date().getTime()
      const diff = now - start

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor(
        (diff % (1000 * 60 * 60)) / (1000 * 60)
      )
      const seconds = Math.floor(
        (diff % (1000 * 60)) / 1000
      )

      setDuration(
        `${hours.toString().padStart(2, '0')}:${minutes
          .toString()
          .padStart(2, '0')}:${seconds
          .toString()
          .padStart(2, '0')}`
      )
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [startTime])

  return (
    <div
      className={`flex items-center font-mono text-slate-700 ${className}`}
    >
      <Clock className="w-4 h-4 mr-2 text-slate-400" />
      {duration}
    </div>
  )
}
