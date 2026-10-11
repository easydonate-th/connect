import { parseSocketFrame } from '../../shared/socket-frame'

// TTS payload fields are long and irrelevant to forwarding
const HIDDEN_KEYS = new Set(['ttsMessage', 'ttsTitle', 'ttsHash', 'ttsConfig'])

/**
 * Prepares an incoming socket frame for the raw log. Returns `null` for a
 * heartbeat reply, strips TTS fields, and returns a non-JSON frame unchanged.
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
