import { useState } from 'react'
import { toast } from 'sonner'

import { getMessages } from '~/libs/i18n'
import { log } from '~/libs/logs'
import { saveVTSSound } from '~/libs/rpc'
import { convertToMP3, SoundConvertError, toBase64 } from '~/libs/sound-convert'

import type { VTSCustomSound } from '../../shared/config'
import type { Messages } from '../../shared/i18n'
import { describeError } from '../../shared/i18n/error'

const addSound = async (file: File) => {
  const mp3 = await convertToMP3(file)

  return saveVTSSound({ name: file.name, data: toBase64(mp3) })
}

// oxlint-disable-next-line anti-slop/no-unknown-parameters -- takes what `catch` gives
const describeFailure = (error: unknown, messages: Messages) =>
  (error instanceof SoundConvertError
    ? messages.vts.hitSound.convertErrors[error.key]
    : describeError(error, messages)) ?? messages.app.errors.unknownError()

const loadSounds = async (files: File[]) => {
  const added: VTSCustomSound[] = []
  const rejected: { fileName: string; error: unknown }[] = []

  for (const file of files) {
    try {
      added.push(await addSound(file))
    } catch (error) {
      rejected.push({ fileName: file.name, error })
    }
  }

  for (const { fileName, error } of rejected) {
    log.warn(
      `Sound not added, ${fileName}: ${describeError(error) ?? 'unknown error'}`
    )
  }

  if (rejected.length > 0) {
    const messages = getMessages()

    toast.warning(messages.vts.hitSound.soundsNotAdded(rejected.length), {
      description: rejected
        .map(
          ({ fileName, error }) =>
            `${fileName}: ${describeFailure(error, messages)}`
        )
        .join('\n'),
    })
  }

  return added
}

/**
 * Converts the picked files to MP3, and the main process stores them. The next
 * save deletes any that the saved config leaves out.
 */
export const useVTSSoundImport = () => {
  const [isImporting, setIsImporting] = useState(false)

  const importSounds = async (files: File[]) => {
    setIsImporting(true)
    const added = await loadSounds(files)
    setIsImporting(false)

    return added
  }

  return { isImporting, importSounds }
}
