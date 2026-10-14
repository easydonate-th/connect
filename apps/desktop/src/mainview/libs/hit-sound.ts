import type { HitSound } from '../../shared/rpc'
import { log } from './logs'

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

const getContext = () => {
  context ??= new AudioContext()

  return context
}

const fetchBytes = async (url: string) => {
  const response = await fetch(url)

  return response.arrayBuffer()
}

export const setSoundReader = (read: SoundReader) => {
  readSound = read
}

const readUserSound = async (fileName: string) => {
  if (!readSound) {
    throw new Error('the RPC bridge is not ready')
  }

  const binary = atob(await readSound(fileName))

  return Uint8Array.from(binary, char => char.codePointAt(0) ?? 0).buffer
}

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

const load = async (sound: string) => {
  const audio = getContext()
  const [isRunning, buffer] = await Promise.all([
    startOutput(audio),
    loadSound(audio, sound),
  ])

  return isRunning ? { audio, buffer } : null
}

const start = (audio: AudioContext, buffer: AudioBuffer, volume: number) => {
  const source = audio.createBufferSource()
  const gain = audio.createGain()

  source.buffer = buffer
  gain.gain.value = volume / 100
  source.connect(gain).connect(audio.destination)
  source.start()

  return source
}

const warnFailed = (message: string) =>
  log.warn(`Failed to play the hit sound: ${message}`)

/** Logs failures instead of throwing. */
export const playHitSound = async ({ sound, volume }: HitSound) => {
  try {
    const loaded = await load(sound)

    if (loaded) {
      start(loaded.audio, loaded.buffer, volume)
    }
  } catch (error) {
    warnFailed(error instanceof Error ? error.message : 'unknown error')
  }
}

type Preview = { source?: AudioBufferSourceNode; onEnd: () => void }

let preview: Preview | undefined

export const stopPreview = () => {
  const current = preview

  preview = undefined
  current?.source?.stop()
  current?.onEnd()
}

export const previewHitSound = async (
  { sound, volume }: HitSound,
  onEnd: () => void
) => {
  stopPreview()

  const current: Preview = { onEnd }

  preview = current

  try {
    const loaded = await load(sound)

    if (preview !== current) {
      return
    }
    if (!loaded) {
      stopPreview()
      return
    }

    current.source = start(loaded.audio, loaded.buffer, volume)
    current.source.addEventListener('ended', () => {
      if (preview === current) {
        preview = undefined
        onEnd()
      }
    })
  } catch (error) {
    if (preview === current) {
      stopPreview()
    }
    warnFailed(error instanceof Error ? error.message : 'unknown error')
  }
}
