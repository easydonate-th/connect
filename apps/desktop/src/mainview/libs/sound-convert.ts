import { createEncoder } from 'wasm-media-encoders'
import mp3WasmUrl from 'wasm-media-encoders/wasm/mp3?url'

const SAMPLE_RATE = 44_100
const VBR_QUALITY = 2
const BLOCK_LENGTH = SAMPLE_RATE
const BASE64_CHUNK = 0x60_00

let wasm: Promise<ArrayBuffer> | undefined

const fetchWasm = async () => {
  const response = await fetch(mp3WasmUrl)

  return response.arrayBuffer()
}

const createMP3Encoder = async () => {
  wasm ??= fetchWasm()

  try {
    return await createEncoder('audio/mpeg', await wasm)
  } catch (error) {
    wasm = undefined

    throw error
  }
}

const decode = async (file: File) => {
  const context = new OfflineAudioContext(2, 1, SAMPLE_RATE)

  try {
    return await context.decodeAudioData(await file.arrayBuffer())
  } catch {
    throw new Error('not an audio or video file this app can read')
  }
}

/** Mixes surround audio down to stereo with Web Audio's speaker rules. */
const toStereo = (audio: AudioBuffer) => {
  const context = new OfflineAudioContext(2, audio.length, audio.sampleRate)
  const source = context.createBufferSource()

  source.buffer = audio
  source.connect(context.destination)
  source.start()

  return context.startRendering()
}

const yieldToUI = () =>
  // oxlint-disable-next-line promise/avoid-new -- `setTimeout` has no promise form in the webview
  new Promise(resolve => {
    setTimeout(resolve, 0)
  })

/**
 * Converts any audio or video file the webview can decode to an MP3 of its
 * audio. Encoding yields to the UI after each block, so the window keeps
 * responding while a long file converts.
 */
export const convertToMP3 = async (file: File) => {
  const decoded = await decode(file)

  if (decoded.length === 0) {
    throw new Error('it has no audio')
  }

  const audio = decoded.numberOfChannels > 2 ? await toStereo(decoded) : decoded
  const channelCount = audio.numberOfChannels === 1 ? 1 : 2
  const channels = Array.from({ length: channelCount }, (_, index) =>
    audio.getChannelData(index)
  )
  const encoder = await createMP3Encoder()
  const chunks: Uint8Array<ArrayBuffer>[] = []

  encoder.configure({
    sampleRate: audio.sampleRate,
    channels: channelCount,
    vbrQuality: VBR_QUALITY,
  })

  for (let start = 0; start < audio.length; start += BLOCK_LENGTH) {
    const block = channels.map(data =>
      data.subarray(start, start + BLOCK_LENGTH)
    )

    // The encoder reuses the array it returns, so this copies each chunk
    chunks.push(new Uint8Array(encoder.encode(block)))
    await yieldToUI()
  }

  chunks.push(new Uint8Array(encoder.finalize()))

  return new Uint8Array(await new Blob(chunks).arrayBuffer())
}

export const toBase64 = (bytes: Uint8Array) => {
  let binary = ''

  for (let start = 0; start < bytes.length; start += BASE64_CHUNK) {
    binary += String.fromCodePoint(
      ...bytes.subarray(start, start + BASE64_CHUNK)
    )
  }

  return btoa(binary)
}
