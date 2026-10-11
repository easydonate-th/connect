import type { Config } from '../../shared/config'
import type { Donation } from '../../shared/donation'
import { isOutputSupported } from '../../shared/platform'
import { logger } from '../logger'
import { sendDonationMIDI } from './vrc/midi'
import { sendDonationOSC } from './vrc/osc'
import { sendDonationVTS } from './vts/throw'

export const forwardDonation = async (
  donation: Donation,
  { vrc, vts }: Config
) => {
  const outputs: { name: string; send: () => void }[] = []

  if (vrc.osc.enabled) {
    outputs.push({
      name: 'OSC',
      send: () => sendDonationOSC(donation, vrc.osc),
    })
  }
  // A config copied from Windows can have MIDI enabled where it can't run
  if (vrc.midi.enabled && isOutputSupported('midi', process.platform)) {
    outputs.push({
      name: 'MIDI',
      send: () => sendDonationMIDI(donation, vrc.midi),
    })
  }
  if (vts.throw.enabled) {
    outputs.push({
      name: 'VTube Studio',
      send: () => sendDonationVTS(donation, vts.throw),
    })
  }

  if (outputs.length === 0) {
    logger.warn(`Donation ${donation.referenceNo}| No integrations enabled`)

    return
  }

  const results = await Promise.allSettled(
    outputs.map(output => Promise.try(output.send))
  )

  for (const [index, result] of results.entries()) {
    if (result.status === 'rejected') {
      logger.error(
        `Failed to send donation ${donation.referenceNo} via ${outputs[index]?.name}`,
        result.reason instanceof Error ? result.reason : undefined
      )
    }
  }
}
