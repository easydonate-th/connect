import { z } from 'zod'

import { withFallback } from './fallback'
import { parseSocketFrame } from './socket-frame'

/**
 * `DONATE` message from the EasyDonate widget socket, e.g.
 * `{"command":"DONATE","data":{"referenceNo":"TEST","donatorName":"gusbell",
 * "donateMessage":"...","amount":500,...},"serverNow":1791569217758}`.
 * TTS fields (`ttsMessage`, `ttsTitle`, `ttsHash`, `ttsConfig`) are dropped.
 */
const DonateMessageSchema = z
  .object({
    command: z.literal('DONATE'),
    data: z.object({
      referenceNo: withFallback(z.string(), ''),
      donatorName: withFallback(z.string(), ''),
      donateMessage: withFallback(z.string(), ''),
      /** Amount in THB */
      amount: z.number(),
    }),
    /** Unix epoch milliseconds on the server */
    serverNow: z.number().optional(),
  })
  .transform(({ data, serverNow }) => ({
    referenceNo: data.referenceNo,
    donatorName: data.donatorName,
    message: data.donateMessage,
    amount: data.amount,
    timestamp: serverNow ?? Date.now(),
  }))

const SocketMessageSchema = z
  .string()
  .transform((text, ctx) => {
    try {
      return parseSocketFrame(text)
    } catch {
      ctx.addIssue({ code: 'custom', message: 'Invalid JSON' })
      return z.NEVER
    }
  })
  .pipe(DonateMessageSchema)

/** A donation received from the EasyDonate alert widget socket. */
export type Donation = z.output<typeof DonateMessageSchema>

/**
 * Parses a raw socket frame into a `Donation`. Returns `null` for other
 * commands (e.g. heartbeat replies) and malformed messages.
 */
export const parseDonationMessage = (frame: string): Donation | null => {
  const result = SocketMessageSchema.safeParse(frame)

  return result.success ? result.data : null
}
