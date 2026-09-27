import { describe, expect, it, vi } from 'vitest'
import { createSpeechCuePlayer } from './speech'

describe('speech cue player', () => {
  it('does not overlap spoken cues', () => {
    const utterances: Array<{ onend: (() => void) | null }> = []
    const speak = vi.fn(utterance => { utterances.push(utterance) })
    const player = createSpeechCuePlayer({
      synthesis: { speak, cancel: vi.fn() },
      createUtterance: () => ({ text: '', onend: null, onerror: null })
    })

    player.enqueue('Run hard for two minutes')
    player.enqueue('One minute remaining')
    expect(speak).toHaveBeenCalledTimes(1)
    utterances[0].onend?.()
    expect(speak).toHaveBeenCalledTimes(2)
  })

  it('emits a fallback when speech fails', () => {
    const fallback = vi.fn()
    const utterances: Array<{ onerror: (() => void) | null }> = []
    const player = createSpeechCuePlayer({
      synthesis: { speak: utterance => { utterances.push(utterance) }, cancel: vi.fn() },
      createUtterance: () => ({ text: '', onend: null, onerror: null }),
      onFallback: fallback
    })

    player.enqueue('Begin')
    utterances[0].onerror?.()
    expect(fallback).toHaveBeenCalledWith('Begin')
  })
})
