import { Client } from 'node-osc'

import type { OSCConfig } from '../../../shared/config'
import type { Donation } from '../../../shared/donation'
import { logger } from '../../logger'

export const sendDonationOSC = async (data: Donation, config: OSCConfig) => {
  const client = new Client(config.host, config.port)

  client.on('error', (error: Error) =>
    logger.warn(`[OSC] ${config.host}:${config.port} | Socket error`, error)
  )

  try {
    await Promise.all([
      client.send('/ezdn/reference', data.referenceNo),
      client.send('/ezdn/name', data.donatorName),
      client.send('/ezdn/message', data.message),
      client.send('/ezdn/amount', data.amount),
    ])
  } finally {
    await client.close()
  }

  logger.info(`[OSC] ${config.host}:${config.port} | Message sent`)
}
