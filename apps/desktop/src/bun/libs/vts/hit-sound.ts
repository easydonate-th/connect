import type { VTSThrowConfig } from '../../../shared/config'
import type { HitSound } from '../../../shared/rpc'
import { logger } from '../../logger'

type HitSoundSink = (sound: HitSound) => void

let sink: HitSoundSink | undefined

/**
 * VTube Studio's API can't play audio, so the webview plays hit sounds, and
 * stream software captures them with the desktop audio.
 */
export const setHitSoundSink = (next: HitSoundSink) => {
  sink = next
}

/** Sends the config's hit sound to the webview, as the item lands. */
export const playHitSound = ({ hitSound, hitVolume }: VTSThrowConfig) => {
  if (hitSound === 'none' || hitVolume === 0) {
    return
  }

  try {
    sink?.({ sound: hitSound, volume: hitVolume })
  } catch (error) {
    logger.warn(
      '[VTS] Failed to play the hit sound',
      error instanceof Error ? error : undefined
    )
  }
}
