import { BrowserView } from 'electrobun/main'

import type { AppRPC } from '../shared/rpc'
import { getConfig, saveConfig } from './config'
import { forwardDonation } from './libs/vrc/forward'

export const createAppRPC = () =>
  BrowserView.defineRPC<AppRPC>({
    handlers: {
      requests: {
        getConfig: () => getConfig(),
        saveConfig: config => saveConfig(config),
      },
      messages: {
        donation: donation => {
          void forwardDonation(donation, getConfig())
        },
      },
    },
  })
