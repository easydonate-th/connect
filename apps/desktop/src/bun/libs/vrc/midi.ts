import type { MIDIConfig } from '../../../shared/config'
import type { Donation } from '../../../shared/donation'
import { logger } from '../../logger'

/**
 * Sends a donation to VRChat over MIDI (to `config.deviceName` on
 * `config.channel`). Only called when MIDI output is enabled in the saved
 * settings.
 */
// oxlint-disable-next-line require-await -- stub; remove once MIDI is implemented
export const sendDonationMIDI = async (
  donation: Donation,
  config: MIDIConfig
): Promise<void> => {
  // TODO: implement MIDI output
  logger.info(
    `[MIDI] ${config.deviceName || '(no device)'} ch ${config.channel} | Message sent`
  )
}
