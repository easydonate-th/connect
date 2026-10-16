import { useState } from 'react'
import { toast } from 'sonner'

import { getMessages } from '~/libs/i18n'
import { log } from '~/libs/logs'
import { getVTSItems } from '~/libs/rpc'

import type { VTSThrowConfig } from '../../shared/config'
import { describeError } from '../../shared/i18n/error'

type Endpoint = Pick<VTSThrowConfig, 'host' | 'port'>

const loadItems = async (endpoint: Endpoint) => {
  try {
    return await getVTSItems(endpoint)
  } catch (error) {
    toast.error(getMessages().vts.throw.listItemsFailed, {
      description: describeError(error, getMessages()),
    })
    log.error(
      `Failed to list VTube Studio items: ${describeError(error) ?? 'unknown error'}`
    )

    return null
  }
}

/**
 * Lists the `Items` folder only on `scan()`, since VTube Studio reads it from
 * disk and the first listing asks the user to allow the plugin. `items` is
 * `null` until a scan succeeds.
 */
export const useVTSItems = () => {
  const [items, setItems] = useState<string[] | null>(null)
  const [isScanning, setIsScanning] = useState(false)

  const scan = async (endpoint: Endpoint) => {
    setIsScanning(true)
    const scanned = await loadItems(endpoint)
    setIsScanning(false)

    if (scanned) {
      setItems(scanned)
    }
  }

  return { items, isScanning, scan }
}
