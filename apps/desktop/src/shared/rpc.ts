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
  /** Why each image VTube Studio couldn't use was left out */
  rejected: string[]
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
