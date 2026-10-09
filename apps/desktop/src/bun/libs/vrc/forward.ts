import type { Config } from '../../../shared/config'
import type { Donation } from '../../../shared/donation'
import { logger } from '../../logger'
import { sendDonationMIDI } from './midi'
import { sendDonationOSC } from './osc'

/**
 * Sends a donation to every enabled VRChat output. Outputs run independently,
 * so one failing never blocks the other.
 */
export const forwardDonation = async (
  donation: Donation,
  { vrc }: Config
): Promise<void> => {
  const outputs: { name: string; send: () => Promise<void> }[] = []

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

  if (outputs.length === 0) {
    logger.warn(
      `Donation ${donation.referenceNo} not forwarded: no VRChat output enabled in saved settings`
    )
    return
  }

  const results = await Promise.allSettled(outputs.map(output => output.send()))

  // Successes are logged by each output
  for (const [index, result] of results.entries()) {
    if (result.status === 'rejected') {
      logger.error(
        `Failed to send donation ${donation.referenceNo} via ${outputs[index]?.name}`,
        result.reason instanceof Error ? result.reason : undefined
      )
    }
  }
}
