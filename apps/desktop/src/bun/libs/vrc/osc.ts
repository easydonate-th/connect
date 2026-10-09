import type { OSCConfig } from '../../../shared/config'
import type { Donation } from '../../../shared/donation'
import { logger } from '../../logger'

/**
 * Sends a donation to VRChat over OSC (UDP to `config.host:config.port`).
 * Only called when OSC output is enabled in the saved settings.
 */
// oxlint-disable-next-line require-await -- stub; remove once OSC is implemented
export const sendDonationOSC = async (
  donation: Donation,
  config: OSCConfig
): Promise<void> => {
  // TODO: implement OSC output
  logger.info(
    `[OSC] ${config.host}:${config.port} <- ${donation.donatorName} ${donation.amount} THB (${donation.referenceNo}), not implemented yet`
  )
}
