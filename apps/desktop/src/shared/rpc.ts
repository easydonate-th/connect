import type { RPCSchema } from 'electrobun/view'

import type {
  Config,
  VTSCustomImage,
  VTSCustomSound,
  VTSThrowConfig,
} from './config'
import type { Donation } from './donation'
import type { Language, Messages } from './i18n'
import type { LogEntry } from './log'

export type VTSConnectionInfo = {
  vTubeStudioVersion: string
  modelName: string | null
}

export type RejectedFile = {
  name: string
  reason: string
}

export type VTSImageImport = {
  added: VTSCustomImage[]
  rejected: RejectedFile[]
}

export type UpdateCheck = {
  currentVersion: string
  latestVersion: string
  updateAvailable: boolean
}

export type HitSound = {
  sound: string
  volume: number
}

export type UpdateStage = {
  stage: keyof Messages['settings']['updateStages']
  percent: number | null
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
      openLogsFolder: { params: undefined; response: string }
      importVTSImages: { params: undefined; response: VTSImageImport }
      saveVTSSound: {
        params: { name: string; data: string }
        response: VTSCustomSound
      }
      readVTSSound: { params: string; response: string }
      getLanguage: { params: undefined; response: Language }
      setLanguage: { params: Language; response: Language }
      getAppVersion: { params: undefined; response: string }
      getPlatform: { params: undefined; response: string }
      checkForUpdate: { params: undefined; response: UpdateCheck }
      installUpdate: { params: undefined; response: string }
      openExternal: { params: string; response: string }
    }
    messages: {
      donation: Donation
      testDonation: { donation: Donation; config: Config }
      log: LogEntry
    }
  }>
  webview: RPCSchema<{
    requests: Record<never, never>
    messages: {
      log: LogEntry
      updateStage: UpdateStage
      hitSound: HitSound
    }
  }>
}
