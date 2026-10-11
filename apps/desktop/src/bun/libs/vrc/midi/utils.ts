import type { Donation } from '../../../../shared/donation'
import type { MIDIMessage } from './winmm'

/**
 * Udon only receives Note On/Off and Control Change events, whose data bytes
 * are 7-bit, so the donation goes out as JSON, one character per Control
 * Change on `channel`. Udon sees that channel as `channel - 1`.
 *
 * - CC 20 with value 0 starts a message, and the receiver clears its buffer.
 * - CC 21 carries one character of the JSON as its value.
 * - CC 22 ends the message. Its value is a checksum, the sum of all character
 *   codes kept to the low 7 bits.
 *
 * `encodeDonation` escapes non-ASCII characters as `\uXXXX` so every character
 * fits in 7 bits, and `VRCJson` unescapes them on the Udon side.
 */
const CC_START = 20
const CC_DATA = 21
const CC_END = 22
const CONTROL_CHANGE = 0xb0

const escapeUnit = (unit: number) => `\\u${unit.toString(16).padStart(4, '0')}`

/** Escapes one character for JSON, using a surrogate pair above U+FFFF. */
const escapeChar = (char: string) => {
  const code = char.codePointAt(0) ?? 0

  if (code <= 0xff_ff) {
    return escapeUnit(code)
  }

  const offset = code - 0x1_00_00
  return (
    escapeUnit(0xd8_00 + Math.floor(offset / 0x4_00)) +
    escapeUnit(0xdc_00 + (offset % 0x4_00))
  )
}

/** Encodes a donation as the Control Change messages described above. */
export const encodeDonation = (
  data: Donation,
  channel: number
): MIDIMessage[] => {
  // JSON.stringify already escapes control characters, so anything outside
  // printable ASCII is non-ASCII text
  const json = JSON.stringify(data).replaceAll(/[^ -~]/gu, escapeChar)
  // Channel 1-16 maps to the low nibble 0-15 of the status byte
  const status = CONTROL_CHANGE + channel - 1
  const messages: MIDIMessage[] = [[status, CC_START, 0]]
  let checksum = 0

  for (const char of json) {
    const code = char.codePointAt(0) ?? 0
    checksum = (checksum + code) % 128
    messages.push([status, CC_DATA, code])
  }
  messages.push([status, CC_END, checksum])

  return messages
}
