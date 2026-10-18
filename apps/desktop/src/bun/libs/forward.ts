import type { Config } from '../../shared/config'
import type { Donation } from '../../shared/donation'
import { isOutputSupported } from '../../shared/platform'
import { logger } from '../logger'
import { sendDonationMIDI } from './vrc/midi'
import { sendDonationOSC } from './vrc/osc'
import { sendDonationVTS } from './vts/throw'

export const forwardDonation = async (data: Donation, { vrc, vts }: Config) => {
  logger.info(
    `Donation ${data.referenceNo}: ${data.donatorName || 'Anonymous'} donated ${data.amount} THB`
  )

  const outputs: { name: string; send: () => void }[] = []

  if (vrc.osc.enabled) {
    outputs.push({
      name: 'OSC',
      send: () => sendDonationOSC(data, vrc.osc),
    })
  }

  if (vrc.midi.enabled && isOutputSupported('midi', process.platform)) {
    outputs.push({
      name: 'MIDI',
      send: () => sendDonationMIDI(data, vrc.midi),
    })
  }

  if (vts.throw.enabled) {
    outputs.push({
      name: 'VTube Studio',
      send: () => sendDonationVTS(data, vts.throw),
    })
  }

  if (outputs.length === 0) {
    logger.warn(`Donation ${data.referenceNo}| No integrations enabled`)

    return
  }

  const results = await Promise.allSettled(
    outputs.map(output => Promise.try(output.send))
  )

  for (const [index, result] of results.entries()) {
    if (result.status === 'rejected') {
      logger.error(
        `Failed to send donation ${data.referenceNo} via ${outputs[index]?.name}`,
        result.reason instanceof Error ? result.reason : undefined
      )
    }
  }
}
