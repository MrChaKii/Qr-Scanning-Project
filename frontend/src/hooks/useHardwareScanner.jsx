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
  maxInterKeyDelayMs = 120,
  // Safety: clear the buffer if no keys arrive for this long.
  flushDelayMs = 250,
  // If true, we prevent the characters from being typed into the focused input
  // during a likely scan burst. Useful on Zebra devices where DataWedge types
  // into the currently-focused field.
  preventDefaultDuringScan = false,
  // If false, ignore events when focus is in an <input>/<textarea>/<select>.
  allowInInputs = true,
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

    const isEditableElement = (el) => {
      if (!el) return false
      if (el.isContentEditable) return true
      const tag = el.tagName
      return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
    }

    const getPrintableChar = (e) => {
      const key = e.key
      if (typeof key === 'string' && key.length === 1) return key

      // Some Android/Zebra WebViews report key="Unidentified".
      // Fall back to event.code which is often stable.
      const code = e.code
      if (typeof code !== 'string' || !code) return ''
      if (code.startsWith('Key') && code.length === 4) return code.slice(3)
      if (code.startsWith('Digit') && code.length === 6) return code.slice(5)
      if (code.startsWith('Numpad') && code.length === 7) return code.slice(6)

      switch (code) {
        case 'Minus':
          return '-'
        case 'Period':
          return '.'
        case 'Slash':
          return '/'
        case 'Backslash':
          return '\\'
        case 'Space':
          return ' '
        case 'Equal':
          return '='
        default:
          return ''
      }
    }

    const isTerminatorKey = (e) => {
      const key = e.key
      if (terminatorKeys.includes(key)) return true
      // Fallback for key="Unidentified".
      const code = e.code
      return (code === 'Enter' && terminatorKeys.includes('Enter')) || (code === 'Tab' && terminatorKeys.includes('Tab'))
    }

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

      if (!allowInInputs && isEditableElement(e.target)) return

      const key = e.key

      // Ignore pure modifier keys.
      if (key === 'Shift' || key === 'Alt' || key === 'Control' || key === 'Meta') return

      const now = Date.now()
      const timeSinceLast = lastKeyAtRef.current ? now - lastKeyAtRef.current : 0

      const likelyScanBurst = !!bufferRef.current && timeSinceLast > 0 && timeSinceLast <= maxInterKeyDelayMs
      const shouldSuppress =
        preventDefaultDuringScan &&
        likelyScanBurst &&
        isEditableElement(e.target)

      // If the gap is too large, treat it as manual typing and start a new buffer.
      if (bufferRef.current && timeSinceLast > maxInterKeyDelayMs) {
        bufferRef.current = ''
      }

      lastKeyAtRef.current = now

      // Scanner suffix (typically Enter or Tab).
      if (isTerminatorKey(e)) {
        if (shouldSuppress) {
          e.preventDefault()
        }
        const scannedText = bufferRef.current.trim()
        clearBuffer()

        if (scannedText.length >= minLength) {
          onScanRef.current?.(scannedText)
        }
        return
      }

      // Only collect printable characters.
      const printable = getPrintableChar(e)
      if (printable) {
        if (shouldSuppress) {
          // If it looks like a scan burst, avoid polluting focused inputs.
          e.preventDefault()
        }

        bufferRef.current += printable
        scheduleFlush()
      }
    }

    // Use capture so we still see events even if a focused input stops propagation.
    document.addEventListener('keydown', onKeyDown, true)

    return () => {
      document.removeEventListener('keydown', onKeyDown, true)
      clearBuffer()
    }
  }, [
    enabled,
    minLength,
    maxInterKeyDelayMs,
    flushDelayMs,
    preventDefaultDuringScan,
    allowInInputs,
    // Keep deps stable even if caller passes a new array instance each render.
    JSON.stringify(terminatorKeys),
  ])
}
