import { useState } from 'react'
import { toast } from 'sonner'

import { log } from '~/libs/logs'
import { importVTSImages } from '~/libs/rpc'

import type { VTSCustomImage } from '../../shared/config'

const loadImages = async (): Promise<VTSCustomImage[]> => {
  try {
    const { added, rejected } = await importVTSImages()

    if (rejected.length > 0) {
      toast.warning(
        `${rejected.length} image${rejected.length === 1 ? '' : 's'} not added`,
        { description: rejected.join('\n') }
      )
    }

    return added
  } catch (error) {
    const description = error instanceof Error ? error.message : undefined
    toast.error('Failed to add images', { description })
    log.error(`Failed to add images: ${description ?? 'unknown error'}`)

    return []
  }
}

/**
 * The main process copies the picked images into the app, and the next save
 * deletes any that the saved config leaves out.
 */
export const useVTSImageImport = () => {
  const [isImporting, setIsImporting] = useState(false)

  const importImages = async () => {
    setIsImporting(true)
    const added = await loadImages()
    setIsImporting(false)

    return added
  }

  return { isImporting, importImages }
}
