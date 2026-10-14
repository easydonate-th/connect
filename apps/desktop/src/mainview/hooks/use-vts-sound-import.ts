import { useState } from 'react'
import { toast } from 'sonner'

import { loadUserSound } from '~/libs/hit-sound'
import { log } from '~/libs/logs'
import { importVTSSounds } from '~/libs/rpc'

import type { VTSCustomSound } from '../../shared/config'

// A file can pass the main process's header check and still use a codec this
// webview can't decode
const canPlay = async (sound: VTSCustomSound) => {
  try {
    await loadUserSound(sound.fileName)
    return true
  } catch {
    return false
  }
}

const loadSounds = async (): Promise<VTSCustomSound[]> => {
  try {
    const { added, rejected } = await importVTSSounds()
    const playable: VTSCustomSound[] = []

    for (const sound of added) {
      if (await canPlay(sound)) {
        playable.push(sound)
      } else {
        rejected.push(`${sound.name}: this app can't play it`)
        log.warn(`Sound not added, ${sound.name}: this app can't play it`)
      }
    }

    if (rejected.length > 0) {
      toast.warning(
        `${rejected.length} sound${rejected.length === 1 ? '' : 's'} not added`,
        { description: rejected.join('\n') }
      )
    }

    return playable
  } catch (error) {
    const description = error instanceof Error ? error.message : undefined
    toast.error('Failed to add sounds', { description })
    log.error(`Failed to add sounds: ${description ?? 'unknown error'}`)
    return []
  }
}

/**
 * The main process copies the picked sounds into the app, and the next save
 * deletes any that the saved config leaves out.
 */
export const useVTSSoundImport = () => {
  const [isImporting, setIsImporting] = useState(false)

  const importSounds = async () => {
    setIsImporting(true)
    const added = await loadSounds()
    setIsImporting(false)

    return added
  }

  return { isImporting, importSounds }
}
