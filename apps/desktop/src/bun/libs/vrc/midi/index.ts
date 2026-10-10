import type { MIDIConfig } from '../../../../shared/config'
import type { Donation } from '../../../../shared/donation'
import { logger } from '../../../logger'
import { encodeDonation } from './utils'
import { sendMIDI } from './winmm'

/**
 * VRChat reads at most 128 MIDI events per frame: `VRCPortMidiInput.Update`
 * passes its 1024-byte buffer's length to `Pm_Read` as an event count (8 bytes
 * each), so a frame with more events throws `IndexOutOfRangeException` and
 * loses the rest of them. 16 events every 32 ms puts at most 112 events in a
 * frame that takes up to 200 ms.
 */
const PACING = { chunkSize: 16, interval: 32 }

// The last queued send; donations go one at a time, so two never interleave
// on the port
let queue: Promise<void> = Promise.resolve()

export const sendDonationMIDI = async (data: Donation, config: MIDIConfig) => {
  const { deviceName, channel } = config

  if (!deviceName) {
    throw new Error('No MIDI device selected')
  }

  const messages = encodeDonation(data, channel)
  const previous = queue
  const send = (async () => {
    // A failed send is reported by its own caller and must not stop this one
    await Promise.allSettled([previous])
    await sendMIDI(deviceName, messages, PACING)
  })()
  queue = send
  await send

  logger.info(
    `[MIDI] ${deviceName} ch ${channel} | Message sent (${messages.length} messages)`
  )
}
