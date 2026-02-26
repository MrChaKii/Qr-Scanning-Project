let audioContext

export const playScanBeep = async () => {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (!AudioContextClass) return

    if (!audioContext) audioContext = new AudioContextClass()

    // Some browsers require a user gesture; resume if it was suspended.
    if (audioContext.state === 'suspended') {
      await audioContext.resume()
    }

    const oscillator = audioContext.createOscillator()
    const gain = audioContext.createGain()

    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime)

    // Quick attack + decay so it sounds like a scanner beep.
    gain.gain.setValueAtTime(0.0001, audioContext.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.2, audioContext.currentTime + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.15)

    oscillator.connect(gain)
    gain.connect(audioContext.destination)

    oscillator.start()
    oscillator.stop(audioContext.currentTime + 0.16)
  } catch {
    // If audio is blocked by the browser, fail silently.
  }
}
