import { isVTSSoundFileName, VTS_SOUNDS_DIR } from '../../../shared/config'
import type { VTSCustomSound } from '../../../shared/config'
import { TranslatableError } from '../../../shared/i18n/error'
import {
  pruneUserFiles,
  readUserFile,
  startsWith,
  writeUserFile,
} from './user-files'

// An ID3 tag, or the 11 set sync bits that start an MPEG audio frame
const isMP3 = (bytes: Uint8Array) =>
  startsWith(bytes, [0x49, 0x44, 0x33]) ||
  (bytes[0] === 0xff && bytes[1] >= 0xe0)

// The webview converts the file to MP3, because it has the audio decoders
export const saveVTSSound = async ({
  name,
  data,
}: {
  name: string
  data: string
}): Promise<VTSCustomSound> => {
  const bytes = new Uint8Array(Buffer.from(data, 'base64'))

  if (!isMP3(bytes)) {
    throw new TranslatableError('soundNotMP3', name)
  }

  return { fileName: await writeUserFile(VTS_SOUNDS_DIR, 'mp3', bytes), name }
}

export const readVTSSound = (fileName: string) => {
  // The webview names the file, so this keeps the path inside the folder
  if (!isVTSSoundFileName(fileName)) {
    throw new TranslatableError('soundFileNameInvalid', fileName)
  }

  return readUserFile(VTS_SOUNDS_DIR, fileName)
}

export const pruneVTSSounds = (keep: VTSCustomSound[]) =>
  pruneUserFiles(VTS_SOUNDS_DIR, keep)
