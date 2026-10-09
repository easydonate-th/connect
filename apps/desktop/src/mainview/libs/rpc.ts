import { Electroview } from 'electrobun/view'

import { Config } from '../../shared/config'
import { Donation } from '../../shared/donation'
import { AppRPC } from '../../shared/rpc'
import { addLog } from './logs'

const rpc = Electroview.defineRPC<AppRPC>({
  handlers: {
    requests: {},
    messages: {
      log: entry => addLog(entry),
    },
  },
})

export const electroview = new Electroview({ rpc })

// services
export const getConfig = () => rpc.request.getConfig()
export const saveConfig = (config: Config) => rpc.request.saveConfig(config)
export const sendDonation = (donation: Donation) => rpc.send.donation(donation)
