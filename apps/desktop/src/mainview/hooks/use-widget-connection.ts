import { useEffect, useState, useSyncExternalStore } from 'react'

import { getMessages } from '~/libs/i18n'
import { log } from '~/libs/logs'
import {
  connectWidget,
  disconnectWidget,
  getWidgetState,
  sendTestDonation as sendTestDonationRPC,
} from '~/libs/rpc'
import {
  getLastDonation,
  getWidgetState as getMirroredWidgetState,
  setLastDonation,
  setWidgetState,
  subscribeWidgetState,
} from '~/libs/widget-state'

import type { Config } from '../../shared/config'
import { getSocketUrl } from '../../shared/widget'
import type { WidgetState } from '../../shared/widget'

/**
 * Resolves to `null` when the request fails. The main process pushes every
 * state change, so a reply is applied only where no push can be newer.
 */
const requestWidget = async (request: Promise<WidgetState>) => {
  try {
    return await request
  } catch (error) {
    log.error(
      `Failed to reach the alert widget connection: ${error instanceof Error ? error.message : error}`
    )

    return null
  }
}

const syncWidgetState = async (shouldConnect: boolean, widgetUrl: string) => {
  const state = await requestWidget(getWidgetState())

  if (state) {
    setWidgetState(state)
  }

  if (shouldConnect) {
    await requestWidget(connectWidget(widgetUrl))
  }
}

const disconnect = () => {
  void requestWidget(disconnectWidget())
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

  setLastDonation(donation)
  sendTestDonationRPC(donation, config)
}

export const useWidgetConnection = ({ autoConnect, widgetUrl }: Config) => {
  const { status, socketUrl } = useSyncExternalStore(
    subscribeWidgetState,
    getMirroredWidgetState
  )

  const lastDonation = useSyncExternalStore(
    subscribeWidgetState,
    getLastDonation
  )

  const [invalidUrl, setInvalidUrl] = useState<string | null>(null)

  // The main process keeps the socket across webview reloads, and connecting
  // again with the same URL keeps it open
  useEffect(() => {
    void syncWidgetState(
      autoConnect && getSocketUrl(widgetUrl) !== null,
      widgetUrl
    )
  }, [autoConnect, widgetUrl])

  const connect = (url: string) => {
    const isValid = getSocketUrl(url) !== null

    setInvalidUrl(isValid ? null : url)

    if (isValid) {
      void requestWidget(connectWidget(url))
    } else {
      log.warn('Invalid alert widget URL')
    }
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
