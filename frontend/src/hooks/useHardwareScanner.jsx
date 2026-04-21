import { useEffect, useRef } from 'react'

// Zebra (and many enterprise scanners) often act as a "keyboard wedge":
// they rapidly type the decoded text and then send Enter/Tab.
// This hook listens for fast key bursts and calls onScan(text) when a terminator key arrives.
export const useHardwareScanner = ({
  enabled = true,
  onScan,
  terminatorKeys = ['Enter', 'Tab'],
  minLength = 3,
  // If the gap between consecutive keys is larger than this,
  // we assume the user is typing manually (not a scanner) and reset.
  maxInterKeyDelayMs = 60,
  // Safety: clear the buffer if no keys arrive for this long.
  flushDelayMs = 250,
} = {}) => {
  const bufferRef = useRef('')
  const lastKeyAtRef = useRef(0)
  const flushTimerRef = useRef(null)
  const onScanRef = useRef(onScan)

  useEffect(() => {
    onScanRef.current = onScan
  }, [onScan])

  useEffect(() => {
    if (!enabled) return

    const clearBuffer = () => {
      bufferRef.current = ''
      lastKeyAtRef.current = 0
      if (flushTimerRef.current) {
        clearTimeout(flushTimerRef.current)
        flushTimerRef.current = null
      }
    }

    const scheduleFlush = () => {
      if (flushTimerRef.current) clearTimeout(flushTimerRef.current)
      flushTimerRef.current = setTimeout(() => {
        clearBuffer()
      }, flushDelayMs)
    }

    const onKeyDown = (e) => {
      if (e.isComposing) return

      const key = e.key

      // Ignore pure modifier keys.
      if (key === 'Shift' || key === 'Alt' || key === 'Control' || key === 'Meta') return

      const now = Date.now()
      const timeSinceLast = lastKeyAtRef.current ? now - lastKeyAtRef.current : 0

      // If the gap is too large, treat it as manual typing and start a new buffer.
      if (bufferRef.current && timeSinceLast > maxInterKeyDelayMs) {
        bufferRef.current = ''
      }

      lastKeyAtRef.current = now

      // Scanner suffix (typically Enter or Tab).
      if (terminatorKeys.includes(key)) {
        const scannedText = bufferRef.current.trim()
        clearBuffer()

        if (scannedText.length >= minLength) {
          onScanRef.current?.(scannedText)
        }
        return
      }

      // Only collect printable characters.
      if (typeof key === 'string' && key.length === 1) {
        bufferRef.current += key
        scheduleFlush()
      }
    }

    window.addEventListener('keydown', onKeyDown)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      clearBuffer()
    }
  }, [
    enabled,
    minLength,
    maxInterKeyDelayMs,
    flushDelayMs,
    // Keep deps stable even if caller passes a new array instance each render.
    JSON.stringify(terminatorKeys),
  ])
}
