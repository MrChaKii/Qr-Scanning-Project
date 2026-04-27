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
  maxInterKeyDelayMs = 200,
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
      // Fall back to event.code + shift state (important for JSON like {"a":1}).
      const code = e.code
      const shift = !!e.shiftKey

      if (typeof code === 'string' && code) {
        if (code.startsWith('Key') && code.length === 4) {
          const ch = code.slice(3)
          return shift ? ch.toUpperCase() : ch.toLowerCase()
        }

        if (code.startsWith('Digit') && code.length === 6) {
          const d = code.slice(5)
          if (!shift) return d
          const shiftedDigits = {
            0: ')',
            1: '!',
            2: '@',
            3: '#',
            4: '$',
            5: '%',
            6: '^',
            7: '&',
            8: '*',
            9: '(',
          }
          return shiftedDigits[d] ?? d
        }

        if (code.startsWith('Numpad') && code.length === 7) {
          // NumpadX where X is 0-9
          return code.slice(6)
        }

        switch (code) {
          case 'Space':
            return ' '
          case 'Minus':
            return shift ? '_' : '-'
          case 'Equal':
            return shift ? '+' : '='
          case 'Backquote':
            return shift ? '~' : '`'
          case 'BracketLeft':
            return shift ? '{' : '['
          case 'BracketRight':
            return shift ? '}' : ']'
          case 'Backslash':
            return shift ? '|' : '\\'
          case 'Semicolon':
            return shift ? ':' : ';'
          case 'Quote':
            return shift ? '"' : "'"
          case 'Comma':
            return shift ? '<' : ','
          case 'Period':
            return shift ? '>' : '.'
          case 'Slash':
            return shift ? '?' : '/'
          default:
            break
        }
      }

      // Last-resort fallback for older WebViews
      const keyCode = e.keyCode || e.which
      if (typeof keyCode === 'number') {
        // Digits
        if (keyCode >= 48 && keyCode <= 57) {
          const digit = String.fromCharCode(keyCode)
          if (!shift) return digit
          const shiftedDigits = {
            0: ')',
            1: '!',
            2: '@',
            3: '#',
            4: '$',
            5: '%',
            6: '^',
            7: '&',
            8: '*',
            9: '(',
          }
          return shiftedDigits[digit] ?? digit
        }

        // Letters
        if (keyCode >= 65 && keyCode <= 90) {
          const upper = String.fromCharCode(keyCode)
          return shift ? upper : upper.toLowerCase()
        }

        // Common punctuation
        const punctuation = {
          32: ' ',
          186: shift ? ':' : ';',
          187: shift ? '+' : '=',
          188: shift ? '<' : ',',
          189: shift ? '_' : '-',
          190: shift ? '>' : '.',
          191: shift ? '?' : '/',
          192: shift ? '~' : '`',
          219: shift ? '{' : '[',
          220: shift ? '|' : '\\',
          221: shift ? '}' : ']',
          222: shift ? '"' : "'",
        }
        if (Object.prototype.hasOwnProperty.call(punctuation, keyCode)) {
          return punctuation[keyCode]
        }
      }

      return ''
    }

    const isTerminatorKey = (e) => {
      const key = e.key
      if (terminatorKeys.includes(key)) return true

      // Fallbacks for key="Unidentified".
      const code = e.code
      if (code === 'Enter' && terminatorKeys.includes('Enter')) return true
      if (code === 'Tab' && terminatorKeys.includes('Tab')) return true

      const keyCode = e.keyCode || e.which
      if (keyCode === 13 && terminatorKeys.includes('Enter')) return true
      if (keyCode === 9 && terminatorKeys.includes('Tab')) return true

      return false
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

      const hasBuffer = !!bufferRef.current
      const likelyScanBurst = hasBuffer && timeSinceLast > 0 && timeSinceLast <= maxInterKeyDelayMs
      // When a scan is in progress, Zebra will often send a suffix (Enter/Tab).
      // If focus is on a button/link (e.g. Logout), that suffix can trigger navigation.
      // Suppress default behavior during an active scan buffer when enabled.
      const shouldSuppress = preventDefaultDuringScan && (hasBuffer || likelyScanBurst)

      // If the gap is too large, treat it as manual typing and start a new buffer.
      if (bufferRef.current && timeSinceLast > maxInterKeyDelayMs) {
        bufferRef.current = ''
      }

      lastKeyAtRef.current = now

      // Scanner suffix (typically Enter or Tab).
      if (isTerminatorKey(e)) {
        if (shouldSuppress) {
          e.preventDefault()
          e.stopPropagation()
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
          e.stopPropagation()
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
