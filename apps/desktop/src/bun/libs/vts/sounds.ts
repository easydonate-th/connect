import { isVTSSoundFileName, VTS_SOUNDS_DIR } from '../../../shared/config'
import type { VTSCustomSound } from '../../../shared/config'
import type { VTSSoundImport } from '../../../shared/rpc'
import {
  importUserFiles,
  pruneUserFiles,
  readUserFile,
  startsWith,
} from './user-files'

/**
 * Hit sounds last a few seconds. The cap keeps the base64 copy the webview
 * reads over RPC, and the buffer it decodes, small.
 */
const MAX_BYTES = 5 * 1024 * 1024

const findSoundType = (bytes: Uint8Array) => {
  // "RIFF", then "WAVE" after the chunk size
  if (
    startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) &&
    startsWith(bytes.subarray(8), [0x57, 0x41, 0x56, 0x45])
  ) {
    return 'wav'
  }
  // "OggS"
  if (startsWith(bytes, [0x4f, 0x67, 0x67, 0x53])) {
    return 'ogg'
  }
  // An ID3 tag, or the 11 set sync bits that start an MPEG audio frame
  if (
    startsWith(bytes, [0x49, 0x44, 0x33]) ||
    (bytes[0] === 0xff && bytes[1] >= 0xe0)
  ) {
    return 'mp3'
  }

  return null
}

const checkSound = (bytes: Uint8Array) => {
  const type = findSoundType(bytes)

  if (!type) {
    throw new Error('not an MP3, WAV or OGG file')
  }
  if (bytes.length >= MAX_BYTES) {
    throw new Error('larger than 5 MB')
  }

  return type
}

export const importVTSSounds = (): Promise<VTSSoundImport> =>
  importUserFiles(VTS_SOUNDS_DIR, 'Sound', checkSound)

export const readVTSSound = (fileName: string) => {
  // The webview names the file, so this keeps the path inside the folder
  if (!isVTSSoundFileName(fileName)) {
    throw new Error(`Not a sound file name: ${fileName}`)
  }

  return readUserFile(VTS_SOUNDS_DIR, fileName)
}

export const pruneVTSSounds = (keep: VTSCustomSound[]) =>
  pruneUserFiles(VTS_SOUNDS_DIR, keep)
