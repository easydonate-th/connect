import { useState } from 'react'
import { toast } from 'sonner'

import { log } from '~/libs/logs'
import { testVTSConnection } from '~/libs/rpc'

import type { VTSThrowConfig } from '../../shared/config'

type Endpoint = Pick<VTSThrowConfig, 'host' | 'port'>

const runTest = async (endpoint: Endpoint) => {
  try {
    const { vTubeStudioVersion, modelName } = await testVTSConnection(endpoint)

    toast.success(`Connected to VTube Studio ${vTubeStudioVersion}`, {
      description: modelName
        ? `Model: ${modelName}`
        : 'No model loaded, so items have nothing to hit.',
    })
  } catch (error) {
    const description = error instanceof Error ? error.message : undefined
    toast.error('Failed to connect to VTube Studio', { description })
    log.error(
      `Failed to connect to VTube Studio: ${description ?? 'unknown error'}`
    )
  }
}

/** The first test asks the user to allow the plugin in VTube Studio. */
export const useVTSConnectionTest = () => {
  const [isTesting, setIsTesting] = useState(false)

  const test = async (endpoint: Endpoint) => {
    setIsTesting(true)
    await runTest(endpoint)
    setIsTesting(false)
  }

  return { isTesting, test }
}
