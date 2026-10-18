import type { Donation } from '../../../shared/donation'
import { getSocketUrl } from '../../../shared/widget'
import type { WidgetState } from '../../../shared/widget'
import { getConfig } from '../../config'
import { logger } from '../../logger'
import { forwardDonation } from '../forward'
import { getAppVersion } from '../update'
import { parseDonationMessage } from './donation'
import { toRawLogFrame } from './raw-frame'

type WidgetSink = {
  state: (state: WidgetState) => void
  rawFrame: (frame: string) => void
  donation: (donation: Donation) => void
}

// SAFETY: Bun's WebSocket takes options, but the tsconfig includes the DOM
// lib, whose constructor type replaces Bun's and takes only protocols
const BunWebSocket = WebSocket as new (
  url: string,
  options?: string | string[] | Bun.WebSocketOptions
) => WebSocket

const USER_AGENT = `EasyDonate Connect/${await getAppVersion()} (${process.platform}; ${process.arch})`

const MAX_RECONNECT_DELAY_MS = 30_000
const MAX_RECONNECT_JITTER_MS = 1000
const HEARTBEAT_MESSAGE = JSON.stringify({ event: 'ping' })
const HEARTBEAT_INTERVAL_MS = 30_000
const HEARTBEAT_TIMEOUT_MS = 60_000
const HEARTBEAT_CHECK_MS = 3000

let sink: WidgetSink | undefined
let state: WidgetState = { status: 'idle', socketUrl: null }
let socket: WebSocket | null = null
let attempt = 0
let reconnectTimer: ReturnType<typeof setTimeout> | undefined
let heartbeatTimer: ReturnType<typeof setInterval> | undefined

export const setWidgetSink = (next: WidgetSink) => {
  sink = next
}

const notify = (send: (sink: WidgetSink) => void) => {
  try {
    if (sink) {
      send(sink)
    }
  } catch {
    //
  }
}

const setState = (next: WidgetState) => {
  state = next
  notify(current => current.state(state))
}

const handleFrame = (frame: string) => {
  const rawFrame = toRawLogFrame(frame)

  if (rawFrame !== null) {
    notify(current => current.rawFrame(rawFrame))
  }

  const donation = parseDonationMessage(frame)

  if (donation) {
    notify(current => current.donation(donation))
    void forwardDonation(donation, getConfig())
  }
}

/** Stops the current socket without letting its events schedule anything */
const dropSocket = () => {
  clearTimeout(reconnectTimer)
  clearInterval(heartbeatTimer)

  const current = socket

  socket = null
  current?.close()
}

const scheduleReconnect = (socketUrl: string) => {
  dropSocket()
  setState({ status: 'reconnecting', socketUrl })

  const delay =
    Math.min(MAX_RECONNECT_DELAY_MS, 1000 * 2 ** Math.min(attempt, 5)) +
    Math.random() * MAX_RECONNECT_JITTER_MS

  attempt += 1
  // oxlint-disable-next-line no-use-before-define -- the two call each other
  reconnectTimer = setTimeout(() => open(socketUrl), delay)
}

const startHeartbeat = (ws: WebSocket, socketUrl: string) => {
  let lastMessageAt = Date.now()
  let lastPingAt = lastMessageAt

  ws.addEventListener('message', () => {
    lastMessageAt = Date.now()
  })

  heartbeatTimer = setInterval(() => {
    const now = Date.now()

    if (now - lastMessageAt >= HEARTBEAT_TIMEOUT_MS) {
      logger.warn('Alert widget heartbeat timed out')
      scheduleReconnect(socketUrl)
    } else if (
      now - lastMessageAt >= HEARTBEAT_INTERVAL_MS &&
      now - lastPingAt >= HEARTBEAT_INTERVAL_MS
    ) {
      ws.send(HEARTBEAT_MESSAGE)
      lastPingAt = now
    }
  }, HEARTBEAT_CHECK_MS)
}

const open = (socketUrl: string) => {
  let ws: WebSocket

  try {
    ws = new BunWebSocket(socketUrl, {
      headers: { 'User-Agent': USER_AGENT },
    })
  } catch (error) {
    logger.error(
      'Failed to open the alert widget connection',
      error instanceof Error ? error : undefined
    )
    scheduleReconnect(socketUrl)

    return
  }

  socket = ws
  setState({ status: 'connecting', socketUrl })

  ws.addEventListener('open', () => {
    if (socket !== ws) {
      return
    }

    attempt = 0
    setState({ status: 'connected', socketUrl })
    logger.info('Connected to alert widget')
    startHeartbeat(ws, socketUrl)
  })

  // The widget sends text frames only
  ws.addEventListener('message', ({ data }: MessageEvent<string>) => {
    if (socket === ws) {
      handleFrame(data)
    }
  })

  ws.addEventListener('error', () => {
    if (socket === ws) {
      logger.error('Alert widget connection error')
    }
  })

  ws.addEventListener('close', ({ code }) => {
    if (socket === ws) {
      logger.warn(`Alert widget connection closed (code ${code})`)
      scheduleReconnect(socketUrl)
    }
  })
}

export const getWidgetState = () => state

export const connectWidget = (widgetUrl: string) => {
  const socketUrl = getSocketUrl(widgetUrl)

  if (socketUrl === null) {
    logger.warn('Invalid alert widget URL')

    return state
  }

  if (socketUrl === state.socketUrl) {
    return state
  }

  dropSocket()
  attempt = 0
  logger.info('Connecting to alert widget')
  open(socketUrl)

  return state
}

export const disconnectWidget = () => {
  if (state.socketUrl !== null) {
    dropSocket()
    setState({ status: 'idle', socketUrl: null })
    logger.info('Disconnected from alert widget')
  }

  return state
}
