import { useState } from 'react'
import { toast } from 'sonner'

import { getMessages } from '~/libs/i18n'
import { log } from '~/libs/logs'
import { testVTSConnection } from '~/libs/rpc'

import type { VTSThrowConfig } from '../../shared/config'
import { describeError } from '../../shared/i18n/error'

type Endpoint = Pick<VTSThrowConfig, 'host' | 'port'>

const runTest = async (endpoint: Endpoint) => {
  try {
    const { vTubeStudioVersion, modelName } = await testVTSConnection(endpoint)
    const m = getMessages()

    toast.success(m.vts.throw.connected(vTubeStudioVersion), {
      description: modelName
        ? m.vts.throw.model(modelName)
        : m.vts.throw.noModel,
    })
  } catch (error) {
    toast.error(getMessages().vts.throw.connectFailed, {
      description: describeError(error, getMessages()),
    })
    log.error(
      `Failed to connect to VTube Studio: ${describeError(error) ?? 'unknown error'}`
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
