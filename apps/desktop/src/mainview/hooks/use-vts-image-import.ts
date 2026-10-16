import { useState } from 'react'
import { toast } from 'sonner'

import { getMessages } from '~/libs/i18n'
import { log } from '~/libs/logs'
import { importVTSImages } from '~/libs/rpc'

import type { VTSCustomImage } from '../../shared/config'
import { describeError, describeMessage } from '../../shared/i18n/error'

const loadImages = async (): Promise<VTSCustomImage[]> => {
  try {
    const { added, rejected } = await importVTSImages()

    if (rejected.length > 0) {
      toast.warning(getMessages().vts.throw.imagesNotAdded(rejected.length), {
        description: rejected
          .map(
            ({ name, reason }) =>
              `${name}: ${describeMessage(reason, getMessages())}`
          )
          .join('\n'),
      })
    }

    return added
  } catch (error) {
    toast.error(getMessages().vts.throw.addImagesFailed, {
      description: describeError(error, getMessages()),
    })
    log.error(
      `Failed to add images: ${describeError(error) ?? 'unknown error'}`
    )

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
