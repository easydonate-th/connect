import { Electroview } from 'electrobun/view'

import { Config, VTSThrowConfig } from '../../shared/config'
import { Donation } from '../../shared/donation'
import { AppRPC } from '../../shared/rpc'
import { addLog } from './logs'

// Outlasts the main process's two-minute wait for VTube Studio approval
const VTS_REQUEST_TIME = 180_000

type VTSEndpoint = Pick<VTSThrowConfig, 'host' | 'port'>

const rpc = Electroview.defineRPC<AppRPC>({
  maxRequestTime: 10_000,
  handlers: {
    requests: {},
    messages: {
      log: entry => addLog(entry),
    },
  },
})

export const electroview = new Electroview({ rpc })

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
export const openDataFolder = () => rpc.request.openDataFolder()
export const getAppVersion = () => rpc.request.getAppVersion()
export const getPlatform = () => rpc.request.getPlatform()
export const checkForUpdate = () => rpc.request.checkForUpdate()
export const openExternal = (url: string) => rpc.request.openExternal(url)
export const sendDonation = (donation: Donation) => rpc.send.donation(donation)
export const sendTestDonation = (donation: Donation, config: Config) =>
  rpc.send.testDonation({ donation, config })
