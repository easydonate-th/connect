import type { RPCSchema } from 'electrobun/view'

import type { Config, VTSCustomImage, VTSThrowConfig } from './config'
import type { Donation } from './donation'
import type { LogEntry } from './log'

export type VTSConnectionInfo = {
  vTubeStudioVersion: string
  /** `null` when no model is loaded */
  modelName: string | null
}

export type VTSImageImport = {
  added: VTSCustomImage[]
  /** Why the import skipped each image VTube Studio can't use */
  rejected: string[]
}

export type UpdateCheck = {
  currentVersion: string
  /** The desktop app version the latest GitHub release lists */
  latestVersion: string
  updateAvailable: boolean
  releaseUrl: string
}

export type AppRPC = {
  bun: RPCSchema<{
    requests: {
      getConfig: { params: undefined; response: Config }
      /** Also deletes imported images the config no longer lists */
      saveConfig: { params: Config; response: Config }
      getMIDIDevices: { params: undefined; response: string[] }
      // The first VTube Studio call asks the user to allow the plugin there
      getVTSItems: {
        params: Pick<VTSThrowConfig, 'host' | 'port'>
        response: string[]
      }
      testVTSConnection: {
        params: Pick<VTSThrowConfig, 'host' | 'port'>
        response: VTSConnectionInfo
      }
      openDataFolder: { params: undefined; response: string }
      importVTSImages: { params: undefined; response: VTSImageImport }
      getAppVersion: { params: undefined; response: string }
      checkForUpdate: { params: undefined; response: UpdateCheck }
      /** Only opens pages of the app's GitHub repository */
      openExternal: { params: string; response: string }
    }
    messages: {
      donation: Donation
    }
  }>
  webview: RPCSchema<{
    requests: Record<never, never>
    messages: {
      log: LogEntry
    }
  }>
}
