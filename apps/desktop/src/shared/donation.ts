import { parseSocketFrame } from './socket-frame'

type DonateMessage = {
  command: 'DONATE'
  data: {
    referenceNo: string
    donatorName: string
    donateMessage: string
    amount: number
  }
  serverNow?: number
}

export type Donation = {
  referenceNo: string
  donatorName: string
  message: string
  amount: number
  timestamp: number
}

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
