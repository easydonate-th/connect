import type { MIDIConfig } from '../../../../shared/config'
import type { Donation } from '../../../../shared/donation'
import { logger } from '../../../logger'
import { encodeDonation } from './utils'
import { sendMIDI } from './winmm'

export const sendDonationMIDI = (data: Donation, config: MIDIConfig) => {
  if (!config.deviceName) {
    throw new Error('No MIDI device selected')
  }

  const messages = encodeDonation(data, config.channel)
  sendMIDI(config.deviceName, messages)

  logger.info(
    `[MIDI] ${config.deviceName} ch ${config.channel} | Message sent (${messages.length} messages)`
  )
}
