import { BrowserView, Utils } from 'electrobun/main'
import fs from 'node:fs'

import { ConfigSchema } from '../shared/config'
import type { AppRPC } from '../shared/rpc'
import { getConfig, saveConfig } from './config'
import { forwardDonation } from './libs/forward'
import { checkForUpdate, getAppVersion, installUpdate } from './libs/update'
import { getMIDIDevices } from './libs/vrc/midi/winmm'
import { testVTSConnection } from './libs/vts/connection'
import { importVTSImages, pruneVTSImages } from './libs/vts/images'
import { getVTSItems } from './libs/vts/items'
import { pruneVTSSounds, readVTSSound, saveVTSSound } from './libs/vts/sounds'
import { logger } from './logger'

export const createAppRPC = () =>
  BrowserView.defineRPC<AppRPC>({
    handlers: {
      requests: {
        getConfig: () => getConfig(),
        saveConfig: async config => {
          const saved = saveConfig(config)
          const { customImages, customSounds } = saved.vts.throw

          try {
            await Promise.all([
              pruneVTSImages(customImages),
              pruneVTSSounds(customSounds),
            ])
          } catch (error) {
            logger.warn(
              'Failed to delete removed VTube Studio images or hit sounds',
              error instanceof Error ? error : undefined
            )
          }

          return saved
        },
        getMIDIDevices: () => getMIDIDevices(),
        getVTSItems: endpoint => getVTSItems(endpoint),
        testVTSConnection: endpoint => testVTSConnection(endpoint),
        importVTSImages: () => importVTSImages(),
        saveVTSSound: sound => saveVTSSound(sound),
        readVTSSound: fileName => readVTSSound(fileName),
        openDataFolder: () => {
          const folder = Utils.paths.userData
          fs.mkdirSync(folder, { recursive: true })

          if (!Utils.openPath(folder)) {
            throw new Error(`Could not open ${folder}`)
          }

          return folder
        },
        getAppVersion: () => getAppVersion(),
        getPlatform: () => process.platform,
        checkForUpdate: () => checkForUpdate(),
        installUpdate: () => installUpdate(),
        openExternal: url => {
          if (!Utils.openExternal(url)) {
            throw new Error(`Could not open ${url}`)
          }

          return url
        },
      },
      messages: {
        donation: donation => forwardDonation(donation, getConfig()),
        testDonation: ({ donation, config }) =>
          forwardDonation(donation, ConfigSchema.parse(config)),
      },
    },
  })
