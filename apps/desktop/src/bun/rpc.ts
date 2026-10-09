import { BrowserView } from 'electrobun/main'

import type { AppRPC } from '../shared/rpc'
import { getConfig, saveConfig } from './config'
import { forwardDonation } from './libs/vrc/forward'
import { getMIDIDevices } from './libs/vrc/midi/winmm'

export const createAppRPC = () =>
  BrowserView.defineRPC<AppRPC>({
    handlers: {
      requests: {
        getConfig: () => getConfig(),
        saveConfig: config => saveConfig(config),
        getMIDIDevices: () => getMIDIDevices(),
      },
      messages: {
        donation: donation => forwardDonation(donation, getConfig()),
      },
    },
  })
