import { parseSocketFrame } from '../../shared/socket-frame'

// TTS payload fields are long and irrelevant to forwarding
const HIDDEN_KEYS = new Set(['ttsMessage', 'ttsTitle', 'ttsHash', 'ttsConfig'])

/**
 * Prepares an incoming socket frame for the raw log: drops heartbeat replies
 * (returns `null`) and strips TTS fields. Non-JSON frames pass through as-is.
 */
export const toRawLogFrame = (frame: string): string | null => {
  let json
  try {
    json = parseSocketFrame(frame, (key: string, value) =>
      HIDDEN_KEYS.has(key) ? undefined : value
    )
  } catch {
    return frame
  }

  if (json?.command === 'PONG') {
    return null
  }

  return JSON.stringify(json)
}
