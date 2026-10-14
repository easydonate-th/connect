import { useState } from 'react'

import { useWidgetSocket } from '~/hooks/use-widget-socket'
import { log } from '~/libs/logs'
import {
  sendDonation,
  sendTestDonation as sendTestDonationRPC,
} from '~/libs/rpc'
import { getSocketUrl } from '~/libs/utils'

import type { Config } from '../../shared/config'
import type { Donation } from '../../shared/donation'

/**
 * Connects to the alert widget on `connect`, or at launch when the stored
 * `config` has auto connect on, and forwards each donation, real or test, to
 * the main process. A real donation uses the saved config, and a test one the
 * `config` it's sent with, such as the form's unsaved draft.
 */
export const useWidgetConnection = ({ autoConnect, widgetUrl }: Config) => {
  const [socketUrl, setSocketUrl] = useState(() =>
    autoConnect ? getSocketUrl(widgetUrl) : null
  )

  // The widget URL Connect last rejected, which the UI flags until the user
  // edits it
  const [invalidUrl, setInvalidUrl] = useState<string | null>(null)
  const [lastDonation, setLastDonation] = useState<Donation | null>(null)

  const showDonation = (donation: Donation) => {
    log.info(
      `Donation ${donation.referenceNo}: ${donation.donatorName || 'Anonymous'} donated ${donation.amount} THB`
    )
    setLastDonation(donation)
  }

  const forwardDonation = (donation: Donation) => {
    showDonation(donation)
    sendDonation(donation)
  }

  const status = useWidgetSocket(socketUrl, forwardDonation)

  const connect = (url: string) => {
    const nextSocketUrl = getSocketUrl(url)

    setSocketUrl(nextSocketUrl)
    setInvalidUrl(nextSocketUrl === null ? url : null)

    if (nextSocketUrl) {
      log.info('Connecting to alert widget')
    } else {
      log.warn('Invalid alert widget URL')
    }
  }

  const disconnect = () => {
    setSocketUrl(null)
    log.info('Disconnected from alert widget')
  }

  const sendTestDonation = (config: Config) => {
    const timestamp = Date.now()

    const donation = {
      referenceNo: `TEST-${timestamp}`,
      donatorName: 'Test Donor',
      message: 'This is a test donation',
      amount: 100,
      timestamp,
    }

    showDonation(donation)
    sendTestDonationRPC(donation, config)
  }

  return {
    status,
    socketUrl,
    invalidUrl,
    lastDonation,
    connect,
    disconnect,
    sendTestDonation,
  }
}
