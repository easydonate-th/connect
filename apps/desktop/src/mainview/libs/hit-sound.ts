import type { HitSound } from '../../shared/rpc'
import { log } from './logs'

// Kenney's Impact Sounds (CC0), a few takes of each sound, so a donation's
// hits don't all sound the same
const SOUND_URLS = import.meta.glob<string>('../sounds/*.wav', {
  eager: true,
  query: '?url',
  import: 'default',
})

const START_TIMEOUT = 1000

type SoundReader = (fileName: string) => Promise<string>

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
let readSound: SoundReader | undefined

const warnMuted = () => {
  if (!hasWarnedMuted) {
    hasWarnedMuted = true
    log.warn('Hit sounds are muted until you click in this window.')
  }
}

const pickRandom = <T>(values: readonly T[]) =>
  values[Math.floor(Math.random() * values.length)]

// Created on first use, since Chromium warns about a context made before a
// click
const getContext = () => {
  context ??= new AudioContext()

  return context
}

const fetchBytes = async (url: string) => {
  const response = await fetch(url)

  return response.arrayBuffer()
}

/**
 * `libs/rpc.ts` passes its `readVTSSound` request, which this module can't
 * import, since `libs/rpc.ts` imports `playHitSound`.
 */
export const setSoundReader = (read: SoundReader) => {
  readSound = read
}

// Over RPC, because `appdata://` is another origin than the page, and `fetch`
// would need CORS headers from it
const readUserSound = async (fileName: string) => {
  if (!readSound) {
    throw new Error('the RPC bridge is not ready')
  }

  const binary = atob(await readSound(fileName))

  return Uint8Array.from(binary, char => char.codePointAt(0) ?? 0).buffer
}

// Web Audio rather than `<audio>`, which can fail to stream from the custom
// `views://` scheme on macOS
const decode = async (audio: AudioContext, read: () => Promise<ArrayBuffer>) =>
  audio.decodeAudioData(await read())

const loadBuffer = async (
  audio: AudioContext,
  key: string,
  read: () => Promise<ArrayBuffer>
) => {
  let buffer = buffers.get(key)

  if (!buffer) {
    buffer = decode(audio, read)
    buffers.set(key, buffer)
  }

  try {
    return await buffer
  } catch (error) {
    buffers.delete(key)
    throw error
  }
}

const loadSound = (audio: AudioContext, sound: string) => {
  const urls = takes.get(sound)

  if (!urls) {
    return loadBuffer(audio, sound, () => readUserSound(sound))
  }

  const url = pickRandom(urls)

  return loadBuffer(audio, url, () => fetchBytes(url))
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

/** Logs failures instead of throwing. */
export const playHitSound = async ({ sound, volume }: HitSound) => {
  try {
    const audio = getContext()
    const [isRunning, buffer] = await Promise.all([
      startOutput(audio),
      loadSound(audio, sound),
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
