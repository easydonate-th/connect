import type { MIDIConfig } from '../../../../shared/config'
import type { Donation } from '../../../../shared/donation'
import { logger } from '../../../logger'
import { encodeDonation } from './utils'
import { sendMIDI } from './winmm'

/**
 * VRChat reads at most 128 MIDI events per frame. `VRCPortMidiInput.Update`
 * passes the length of its 1024-byte buffer to `Pm_Read` as an event count,
 * but each event takes 8 bytes, so the buffer holds only 128 events. A frame
 * with more events throws `IndexOutOfRangeException` and loses the rest of
 * them. Sending 16 events every 32 ms puts at most 112 events in a frame that
 * takes up to 200 ms.
 */
const PACING = { chunkSize: 16, interval: 32 }

// The last queued send. Donations go out one at a time, so two never
// interleave on the port
let queue: Promise<void> = Promise.resolve()

export const sendDonationMIDI = async (data: Donation, config: MIDIConfig) => {
  const { deviceName, channel } = config

  if (!deviceName) {
    throw new Error('No MIDI device selected')
  }

  const messages = encodeDonation(data, channel)
  const previous = queue

  const send = (async () => {
    // The previous send's caller reports its failure. That failure must not
    // stop this one
    await Promise.allSettled([previous])
    await sendMIDI(deviceName, messages, PACING)
  })()

  queue = send
  await send

  logger.info(
    `[MIDI] ${deviceName} channel ${channel} | Message sent (${messages.length} MIDI events)`
  )
}
