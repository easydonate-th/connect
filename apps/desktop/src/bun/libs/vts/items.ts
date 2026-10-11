import type { VTSThrowConfig } from '../../../shared/config'
import { withVTSSession } from './client'

// VTube Studio reads the `Items` folder from disk for this and may stutter,
// so only call it on demand
export const getVTSItems = (endpoint: Pick<VTSThrowConfig, 'host' | 'port'>) =>
  withVTSSession(endpoint, async session => {
    const { availableItemFiles } = await session.request('ItemListRequest', {
      includeAvailableSpots: false,
      includeItemInstancesInScene: false,
      includeAvailableItemFiles: true,
    })

    return availableItemFiles.map(item => item.fileName)
  })
