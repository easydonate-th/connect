import { VTS_IMAGES_DIR } from '../../../shared/config'
import type { VTSCustomImage } from '../../../shared/config'
import type { VTSImageImport } from '../../../shared/rpc'
import {
  importUserFiles,
  pruneUserFiles,
  readUserFile,
  startsWith,
} from './user-files'

type ImageType = 'png' | 'jpg' | 'gif'

type ImageInfo = { type: ImageType; width: number; height: number }

/** VTube Studio's limits for custom data items */
const MAX_BYTES = 5 * 1024 * 1024
const SIDE_RANGE = { min: 64, max: 2048 }

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]

/** Reads the size from a JPEG's start-of-frame segment. */
const readJPEGSize = (view: DataView) => {
  let offset = 2

  while (offset + 9 <= view.byteLength) {
    if (view.getUint8(offset) !== 0xff) {
      return null
    }

    const marker = view.getUint8(offset + 1)

    // SOF0-SOF15, minus DHT (C4), JPG (C8) and DAC (CC), which share the range
    const isFrame =
      marker >= 0xc0 &&
      marker <= 0xcf &&
      marker !== 0xc4 &&
      marker !== 0xc8 &&
      marker !== 0xcc

    if (isFrame) {
      return {
        height: view.getUint16(offset + 5),
        width: view.getUint16(offset + 7),
      }
    }

    // Fill bytes and standalone markers (RSTn, TEM) have no length
    if (
      marker === 0xff ||
      marker === 0x01 ||
      (marker >= 0xd0 && marker <= 0xd7)
    ) {
      offset += marker === 0xff ? 1 : 2
    } else {
      offset += 2 + view.getUint16(offset + 2)
    }
  }

  return null
}

const readImageInfo = (bytes: Uint8Array): ImageInfo | null => {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)

  if (startsWith(bytes, PNG_SIGNATURE) && bytes.length >= 24) {
    return {
      type: 'png',
      width: view.getUint32(16),
      height: view.getUint32(20),
    }
  }

  // "GIF8"
  if (startsWith(bytes, [0x47, 0x49, 0x46, 0x38]) && bytes.length >= 10) {
    return {
      type: 'gif',
      width: view.getUint16(6, true),
      height: view.getUint16(8, true),
    }
  }

  if (startsWith(bytes, [0xff, 0xd8])) {
    const size = readJPEGSize(view)

    return size && { type: 'jpg', ...size }
  }

  return null
}

const isSideInRange = (side: number) =>
  side >= SIDE_RANGE.min && side <= SIDE_RANGE.max

const findImageProblem = (bytes: Uint8Array, info: ImageInfo) => {
  if (bytes.length >= MAX_BYTES) {
    return 'larger than 5 MB'
  }

  if (!isSideInRange(info.width) || !isSideInRange(info.height)) {
    return `${info.width}x${info.height} px, each side must be ${SIDE_RANGE.min}-${SIDE_RANGE.max} px`
  }

  return null
}

const checkImage = (bytes: Uint8Array) => {
  const info = readImageInfo(bytes)

  if (!info) {
    throw new Error('not a PNG, JPG or GIF image')
  }

  const problem = findImageProblem(bytes, info)

  if (problem) {
    throw new Error(problem)
  }

  return info.type
}

export const importVTSImages = (): Promise<VTSImageImport> =>
  importUserFiles(VTS_IMAGES_DIR, 'Image', checkImage)

export const readVTSImage = ({ fileName }: VTSCustomImage) =>
  readUserFile(VTS_IMAGES_DIR, fileName)

export const pruneVTSImages = (keep: VTSCustomImage[]) =>
  pruneUserFiles(VTS_IMAGES_DIR, keep)
