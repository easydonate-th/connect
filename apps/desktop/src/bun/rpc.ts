import { BrowserView } from 'electrobun/main'

import type { AppRPC } from '../shared/rpc'
import { getConfig, saveConfig } from './config'
import { openDataFolder } from './libs/data-folder'
import { openExternal } from './libs/external'
import { forwardDonation } from './libs/forward'
import { checkForUpdate, getAppVersion } from './libs/update'
import { getMIDIDevices } from './libs/vrc/midi/winmm'
import { testVTSConnection } from './libs/vts/connection'
import { importVTSImages, pruneVTSImages } from './libs/vts/images'
import { getVTSItems } from './libs/vts/items'
import { logger } from './logger'

export const createAppRPC = () =>
  BrowserView.defineRPC<AppRPC>({
    handlers: {
      requests: {
        getConfig: () => getConfig(),
        saveConfig: async config => {
          const saved = saveConfig(config)

          try {
            await pruneVTSImages(saved.vts.throw.customImages)
          } catch (error) {
            logger.warn(
              'Failed to delete removed VTube Studio images',
              error instanceof Error ? error : undefined
            )
          }

          return saved
        },
        getMIDIDevices: () => getMIDIDevices(),
        getVTSItems: endpoint => getVTSItems(endpoint),
        testVTSConnection: endpoint => testVTSConnection(endpoint),
        importVTSImages: () => importVTSImages(),
        openDataFolder: () => openDataFolder(),
        getAppVersion: () => getAppVersion(),
        getPlatform: () => process.platform,
        checkForUpdate: () => checkForUpdate(),
        openExternal: url => openExternal(url),
      },
      messages: {
        donation: donation => forwardDonation(donation, getConfig()),
      },
    },
  })
