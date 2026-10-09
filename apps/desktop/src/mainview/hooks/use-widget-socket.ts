import useWebSocket, { ReadyState } from 'react-use-websocket'

import { addRawLog, log } from '~/libs/logs'

import { Donation, parseDonationMessage } from '../../shared/donation'

export type ConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'reconnecting'

const MAX_RECONNECT_DELAY_MS = 30_000
const MAX_RECONNECT_JITTER_MS = 1000
const HEARTBEAT_MESSAGE = JSON.stringify({ event: 'ping' })
const HEARTBEAT_RETURN_MESSAGE = JSON.stringify({ command: 'PONG', data: 1 })

const toStatus = (
  socketUrl: string | null,
  readyState: ReadyState
): ConnectionStatus => {
  if (socketUrl === null) {
    return 'idle'
  }
  if (readyState === ReadyState.OPEN) {
    return 'connected'
  }
  if (readyState === ReadyState.CONNECTING) {
    return 'connecting'
  }

  return 'reconnecting'
}

/**
 * Keeps a connection to the EasyDonate widget socket open (reconnecting with
 * backoff) while `socketUrl` is set, and passes each donation on.
 */
export const useWidgetSocket = (
  socketUrl: string | null,
  onDonation: (donation: Donation) => void
): ConnectionStatus => {
  const { readyState } = useWebSocket(
    socketUrl,
    {
      retryOnError: true,
      shouldReconnect: () => true,
      reconnectAttempts: Number.MAX_SAFE_INTEGER,
      reconnectInterval: attempt =>
        Math.min(MAX_RECONNECT_DELAY_MS, 1000 * 2 ** Math.min(attempt, 5)) +
        Math.random() * MAX_RECONNECT_JITTER_MS,
      heartbeat: {
        message: HEARTBEAT_MESSAGE,
        returnMessage: HEARTBEAT_RETURN_MESSAGE,
        interval: 30_000,
        timeout: 60_000,
      },
      // Messages are handled in `onMessage`; skip lastMessage re-renders
      filter: () => false,
      onOpen: () => log.info('Connected to alert widget'),
      onClose: ({ code }: CloseEvent) =>
        log.warn(`Alert widget connection closed (code ${code})`),
      onError: () => log.error('Alert widget connection error'),
      onReconnectStop: () => log.error('Gave up reconnecting to alert widget'),
      onMessage: (event: MessageEvent<string>) => {
        addRawLog(event.data)
        const donation = parseDonationMessage(event.data)
        if (donation) {
          onDonation(donation)
        }
      },
    },
    socketUrl !== null
  )

  return toStatus(socketUrl, readyState)
}
