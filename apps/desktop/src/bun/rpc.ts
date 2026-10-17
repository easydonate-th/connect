import { BrowserView, Utils } from 'electrobun/main'
import fs from 'node:fs'

import { ConfigSchema } from '../shared/config'
import { isLanguage } from '../shared/i18n'
import { TranslatableError } from '../shared/i18n/error'
import type { AppRPC } from '../shared/rpc'
import { getConfig, saveConfig } from './config'
import { getLanguage, saveLanguage } from './language'
import { forwardDonation } from './libs/forward'
import { checkForUpdate, getAppVersion, installUpdate } from './libs/update'
import { getMIDIDevices } from './libs/vrc/midi/winmm'
import { testVTSConnection } from './libs/vts/connection'
import { importVTSImages, pruneVTSImages } from './libs/vts/images'
import { getVTSItems } from './libs/vts/items'
import { pruneVTSSounds, readVTSSound, saveVTSSound } from './libs/vts/sounds'
import { getLogsFolder, writeAppLog } from './log-file'
import { logger } from './logger'

type AppRPCOptions = {
  onLanguageChange: () => void
}

const openFolder = (folder: string) => {
  fs.mkdirSync(folder, { recursive: true })

  if (!Utils.openPath(folder)) {
    throw new TranslatableError('openFolderFailed', folder)
  }

  return folder
}

export const createAppRPC = ({ onLanguageChange }: AppRPCOptions) =>
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
        openDataFolder: () => openFolder(Utils.paths.userData),
        openLogsFolder: () => openFolder(getLogsFolder()),
        getLanguage: () => getLanguage(),
        setLanguage: language => {
          const saved = saveLanguage(isLanguage(language) ? language : 'en')
          onLanguageChange()

          return saved
        },
        getAppVersion: () => getAppVersion(),
        getPlatform: () => process.platform,
        checkForUpdate: () => checkForUpdate(),
        installUpdate: () => installUpdate(),
        openExternal: url => {
          if (!Utils.openExternal(url)) {
            throw new TranslatableError('openUrlFailed', url)
          }

          return url
        },
      },
      messages: {
        donation: donation => forwardDonation(donation, getConfig()),
        testDonation: ({ donation, config }) =>
          forwardDonation(donation, ConfigSchema.parse(config)),
        log: entry => writeAppLog(entry),
      },
    },
  })
