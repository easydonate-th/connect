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
  /** The version in the latest GitHub release's `update.json` */
  latestVersion: string
  updateAvailable: boolean
}

export type AppRPC = {
  bun: RPCSchema<{
    requests: {
      getConfig: { params: undefined; response: Config }
      saveConfig: { params: Config; response: Config }
      getMIDIDevices: { params: undefined; response: string[] }
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
      getPlatform: { params: undefined; response: string }
      checkForUpdate: { params: undefined; response: UpdateCheck }
      /**
       * Downloads the update, then quits and relaunches into it. Responds
       * with the version it installs.
       */
      installUpdate: { params: undefined; response: string }
      openExternal: { params: string; response: string }
    }
    messages: {
      donation: Donation
      /** A test donation, forwarded with the UI's unsaved draft */
      testDonation: { donation: Donation; config: Config }
    }
  }>
  webview: RPCSchema<{
    requests: Record<never, never>
    messages: {
      log: LogEntry
    }
  }>
}
