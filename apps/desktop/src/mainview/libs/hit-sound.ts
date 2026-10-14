import type { HitSound } from '../../shared/rpc'
import { log } from './logs'

// Kenney's Impact Sounds (CC0), a few takes of each sound, so a donation's
// hits don't all sound the same
const SOUND_URLS = import.meta.glob<string>('../sounds/*.wav', {
  eager: true,
  query: '?url',
  import: 'default',
})

/** Longest wait for the audio output to start before a sound is dropped */
const START_TIMEOUT = 1000

const takes = new Map<string, string[]>()

for (const [path, url] of Object.entries(SOUND_URLS)) {
  const sound = /(?<sound>[a-z]+)-\d+\.wav$/u.exec(path)?.groups?.sound

  if (sound) {
    takes.set(sound, [...(takes.get(sound) ?? []), url])
  }
}

let context: AudioContext | undefined
const buffers = new Map<string, Promise<AudioBuffer>>()
let hasWarnedMuted = false

const warnMuted = () => {
  if (!hasWarnedMuted) {
    hasWarnedMuted = true
    log.warn('Hit sounds are muted until you click in this window.')
  }
}

const pickRandom = <T>(values: readonly T[]) =>
  values[Math.floor(Math.random() * values.length)]

// Web Audio rather than `<audio>`, which can fail to stream from the custom
// `views://` scheme on macOS
const decode = async (audio: AudioContext, url: string) => {
  const response = await fetch(url)

  return audio.decodeAudioData(await response.arrayBuffer())
}

const loadBuffer = async (audio: AudioContext, url: string) => {
  let buffer = buffers.get(url)

  if (!buffer) {
    buffer = decode(audio, url)
    buffers.set(url, buffer)
  }

  try {
    return await buffer
  } catch (error) {
    // Lets the next hit try again
    buffers.delete(url)
    throw error
  }
}

/**
 * `resume` waits for a click while the webview keeps sound off. A sound whose
 * output starts later than `START_TIMEOUT` is dropped, so the click doesn't
 * play every waiting hit at once.
 */
const startOutput = async (audio: AudioContext) => {
  if (audio.state === 'running') {
    return true
  }

  const startedAt = performance.now()
  const timer = setTimeout(warnMuted, START_TIMEOUT)

  try {
    await audio.resume()
  } finally {
    clearTimeout(timer)
  }

  return performance.now() - startedAt < START_TIMEOUT
}

/** Plays a random take of the sound. Logs failures instead of throwing. */
export const playHitSound = async ({ sound, volume }: HitSound) => {
  const urls = takes.get(sound)

  if (!urls) {
    log.warn(`Unknown hit sound: ${sound}`)

    return
  }

  try {
    // Created on first use, since Chromium warns about a context made before
    // a click
    context ??= new AudioContext()
    const audio = context
    const [isRunning, buffer] = await Promise.all([
      startOutput(audio),
      loadBuffer(audio, pickRandom(urls)),
    ])

    if (!isRunning) {
      return
    }

    const source = audio.createBufferSource()
    const gain = audio.createGain()

    source.buffer = buffer
    gain.gain.value = volume / 100
    source.connect(gain).connect(audio.destination)
    source.start()
  } catch (error) {
    log.warn(
      `Failed to play the hit sound: ${error instanceof Error ? error.message : 'unknown error'}`
    )
  }
}
