import { useState } from 'react'

import { useWidgetSocket } from '~/hooks/use-widget-socket'
import { getMessages } from '~/libs/i18n'
import { log } from '~/libs/logs'
import {
  sendDonation,
  sendTestDonation as sendTestDonationRPC,
} from '~/libs/rpc'
import { getSocketUrl } from '~/libs/utils'

import type { Config } from '../../shared/config'
import type { Donation } from '../../shared/donation'

export const useWidgetConnection = ({ autoConnect, widgetUrl }: Config) => {
  const [socketUrl, setSocketUrl] = useState(() =>
    autoConnect ? getSocketUrl(widgetUrl) : null
  )

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
    const m = getMessages().widget

    const donation = {
      referenceNo: `TEST-${timestamp}`,
      donatorName: m.testDonorName,
      message: m.testMessage,
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
