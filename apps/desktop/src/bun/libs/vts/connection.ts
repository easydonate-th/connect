import type { VTSThrowConfig } from '../../../shared/config'
import type { VTSConnectionInfo } from '../../../shared/rpc'
import { logger } from '../../logger'
import { withVTSSession } from './client'

export const testVTSConnection = async (
  endpoint: Pick<VTSThrowConfig, 'host' | 'port'>
): Promise<VTSConnectionInfo> => {
  const info = await withVTSSession(endpoint, async session => {
    const [{ vTubeStudioVersion }, model] = await Promise.all([
      session.request('APIStateRequest', {}),
      session.request('CurrentModelRequest', {}),
    ])

    return {
      vTubeStudioVersion,
      modelName: model.modelLoaded ? model.modelName : null,
    }
  })

  logger.info(
    `[VTS] ${endpoint.host}:${endpoint.port} | Connected to VTube Studio ${info.vTubeStudioVersion}, ${info.modelName ? `model ${info.modelName}` : 'no model loaded'}`
  )

  return info
}
