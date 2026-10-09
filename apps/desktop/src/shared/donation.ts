import { parseSocketFrame } from './socket-frame'

/**
 * `DONATE` message from the EasyDonate widget socket, e.g.
 * `{"command":"DONATE","data":{"referenceNo":"TEST","donatorName":"gusbell",
 * "donateMessage":"...","amount":500,...},"serverNow":1791569217758}`.
 * TTS fields (`ttsMessage`, `ttsTitle`, `ttsHash`, `ttsConfig`) are ignored.
 */
type DonateMessage = {
  command: 'DONATE'
  data: {
    referenceNo: string
    donatorName: string
    donateMessage: string
    /** Amount in THB */
    amount: number
  }
  /** Unix epoch milliseconds on the server */
  serverNow?: number
}

/** A donation received from the EasyDonate alert widget socket. */
export type Donation = {
  referenceNo: string
  donatorName: string
  message: string
  amount: number
  timestamp: number
}

/**
 * Parses a raw socket frame into a `Donation`. Returns `null` for other
 * commands (e.g. heartbeat replies) and non-JSON frames. The widget's message
 * shape is fixed, so fields are not validated.
 */
export const parseDonationMessage = (frame: string): Donation | null => {
  let message
  try {
    message = parseSocketFrame(frame)
  } catch {
    return null
  }

  if (message?.command !== 'DONATE') {
    return null
  }

  // SAFETY: `command` is `DONATE`, and the widget always sends that command
  // with the `DonateMessage` shape
  const { data, serverNow } = message as DonateMessage

  return {
    referenceNo: data.referenceNo,
    donatorName: data.donatorName,
    message: data.donateMessage,
    amount: data.amount,
    timestamp: serverNow ?? Date.now(),
  }
}
