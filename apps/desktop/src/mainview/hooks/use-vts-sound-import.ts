import { useState } from 'react'
import { toast } from 'sonner'

import { log } from '~/libs/logs'
import { saveVTSSound } from '~/libs/rpc'
import { convertToMP3, toBase64 } from '~/libs/sound-convert'

import type { VTSCustomSound } from '../../shared/config'

const addSound = async (file: File) => {
  const mp3 = await convertToMP3(file)

  return saveVTSSound({ name: file.name, data: toBase64(mp3) })
}

const loadSounds = async (files: File[]) => {
  const added: VTSCustomSound[] = []
  const rejected: string[] = []

  for (const file of files) {
    try {
      added.push(await addSound(file))
    } catch (error) {
      rejected.push(
        `${file.name}: ${error instanceof Error ? error.message : 'unknown error'}`
      )
    }
  }

  for (const reason of rejected) {
    log.warn(`Sound not added, ${reason}`)
  }

  if (rejected.length > 0) {
    toast.warning(
      `${rejected.length} sound${rejected.length === 1 ? '' : 's'} not added`,
      { description: rejected.join('\n') }
    )
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
