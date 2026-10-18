import { Electroview } from 'electrobun/view'

import { Config, VTSThrowConfig } from '../../shared/config'
import { Donation } from '../../shared/donation'
import type { Language } from '../../shared/i18n'
import { AppRPC } from '../../shared/rpc'
import { playHitSound, setSoundReader } from './hit-sound'
import { addLog, addRawLog, setLogForwarder } from './logs'
import { setUpdateStage } from './update-stage'
import { setLastDonation, setWidgetState } from './widget-state'

// Outlasts the main process's two-minute wait for VTube Studio approval
const VTS_REQUEST_TIME = 180_000

// Outlasts the updater's 30-second wait for update.json
const UPDATE_CHECK_TIME = 40_000

// A long hit sound's base64 can take longer than the default to cross RPC
const SOUND_TRANSFER_TIME = 60_000

type VTSEndpoint = Pick<VTSThrowConfig, 'host' | 'port'>

const rpc = Electroview.defineRPC<AppRPC>({
  maxRequestTime: 10_000,
  handlers: {
    requests: {},
    messages: {
      log: entry => addLog(entry),
      updateStage: stage => setUpdateStage(stage),
      hitSound: sound => playHitSound(sound),
      widgetState: state => setWidgetState(state),
      rawFrame: frame => addRawLog(frame),
      donation: donation => setLastDonation(donation),
    },
  },
})

export const electroview = new Electroview({ rpc })

setSoundReader(fileName =>
  rpc.request.readVTSSound(fileName, { maxRequestTime: SOUND_TRANSFER_TIME })
)

setLogForwarder(entry => rpc.send.log(entry))

export const getConfig = () => rpc.request.getConfig()
export const saveConfig = (config: Config) => rpc.request.saveConfig(config)
export const getMIDIDevices = () => rpc.request.getMIDIDevices()

export const getVTSItems = (endpoint: VTSEndpoint) =>
  rpc.request.getVTSItems(endpoint, { maxRequestTime: VTS_REQUEST_TIME })

export const testVTSConnection = (endpoint: VTSEndpoint) =>
  rpc.request.testVTSConnection(endpoint, { maxRequestTime: VTS_REQUEST_TIME })

// Waits on a file dialog, which has no time limit
export const importVTSImages = () =>
  rpc.request.importVTSImages(undefined, { maxRequestTime: Infinity })

export const saveVTSSound = (sound: { name: string; data: string }) =>
  rpc.request.saveVTSSound(sound, { maxRequestTime: SOUND_TRANSFER_TIME })

export const openDataFolder = () => rpc.request.openDataFolder()
export const openLogsFolder = () => rpc.request.openLogsFolder()
export const getLanguage = () => rpc.request.getLanguage()

export const setLanguage = (language: Language) =>
  rpc.request.setLanguage(language)

export const getAppVersion = () => rpc.request.getAppVersion()
export const getPlatform = () => rpc.request.getPlatform()

export const checkForUpdate = () =>
  rpc.request.checkForUpdate(undefined, { maxRequestTime: UPDATE_CHECK_TIME })

// Each download the updater makes has its own time limit
export const installUpdate = () =>
  rpc.request.installUpdate(undefined, { maxRequestTime: Infinity })

export const openExternal = (url: string) => rpc.request.openExternal(url)
export const getWidgetState = () => rpc.request.getWidgetState()

export const connectWidget = (widgetUrl: string) =>
  rpc.request.connectWidget(widgetUrl)

export const disconnectWidget = () => rpc.request.disconnectWidget()

export const sendTestDonation = (donation: Donation, config: Config) =>
  rpc.send.testDonation({ donation, config })
