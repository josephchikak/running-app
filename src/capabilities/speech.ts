interface SpeechUtteranceLike {
  text: string
  onend: (() => void) | null
  onerror: (() => void) | null
}

interface SpeechSynthesisLike {
  speak: (utterance: SpeechUtteranceLike) => void
  cancel: () => void
}

interface SpeechCuePlayerOptions {
  synthesis?: SpeechSynthesisLike
  createUtterance?: () => SpeechUtteranceLike
  onFallback?: (text: string) => void
}

export interface SpeechCuePlayer {
  prime: () => void
  enqueue: (text: string) => void
  stop: () => void
}

export function createSpeechCuePlayer (options: SpeechCuePlayerOptions = {}): SpeechCuePlayer {
  const synthesis = options.synthesis ?? getBrowserSynthesis()
  const createUtterance = options.createUtterance ?? getBrowserUtterance
  const queue: string[] = []
  let isSpeaking = false

  function playNext () {
    if (isSpeaking || queue.length === 0) return
    const text = queue.shift()
    if (!text || !synthesis) {
      if (text) options.onFallback?.(text)
      return
    }

    const utterance = createUtterance()
    utterance.text = text
    utterance.onend = () => {
      isSpeaking = false
      playNext()
    }
    utterance.onerror = () => {
      isSpeaking = false
      options.onFallback?.(text)
      playNext()
    }
    isSpeaking = true
    synthesis.speak(utterance)
  }

  return {
    prime () {
      if (!synthesis) options.onFallback?.('Spoken cues are unavailable')
    },
    enqueue (text) {
      queue.push(text)
      playNext()
    },
    stop () {
      queue.length = 0
      isSpeaking = false
      synthesis?.cancel()
    }
  }
}

function getBrowserSynthesis (): SpeechSynthesisLike | undefined {
  if (!('speechSynthesis' in globalThis)) return undefined
  return {
    speak: utterance => globalThis.speechSynthesis.speak(utterance as SpeechSynthesisUtterance),
    cancel: () => globalThis.speechSynthesis.cancel()
  }
}

function getBrowserUtterance (): SpeechUtteranceLike {
  if (!('SpeechSynthesisUtterance' in globalThis)) {
    return { text: '', onend: null, onerror: null }
  }
  return new SpeechSynthesisUtterance() as unknown as SpeechUtteranceLike
}
