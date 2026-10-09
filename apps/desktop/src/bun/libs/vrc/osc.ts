import { Client } from 'node-osc'

import type { OSCConfig } from '../../../shared/config'
import type { Donation } from '../../../shared/donation'
import { logger } from '../../logger'

/**
 * Sends a donation to VRChat over OSC (UDP to `config.host:config.port`).
 * Only called when OSC output is enabled in the saved settings.
 */
// oxlint-disable-next-line require-await -- stub; remove once OSC is implemented
export const sendDonationOSC = async (
  data: Donation,
  config: OSCConfig
): Promise<void> => {
  try {
    const client = new Client(config.host, config.port)

    await Promise.all([
      client.send('/ezdn/ref', data.referenceNo),
      client.send('/ezdn/name', data.donatorName),
      client.send('/ezdn/message', data.message),
      client.send('/ezdn/amount', data.amount),
    ])
    await client.close()

    logger.info(`[OSC] ${config.host}:${config.port} | Message sent`)
  } catch {
    logger.info(`[OSC] ${config.host}:${config.port} | Failed to send message`)
  }
}
