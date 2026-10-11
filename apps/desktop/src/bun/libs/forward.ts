import type { Config } from '../../shared/config'
import type { Donation } from '../../shared/donation'
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
  if (vrc.midi.enabled) {
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
    logger.warn(
      `Donation ${donation.referenceNo} not forwarded because no output is enabled in the saved settings`
    )

    return
  }

  // Promise.try turns a synchronous throw into a rejection, so one output
  // failing never stops the others
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
