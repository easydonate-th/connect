import type { VTSThrowConfig } from '../../../shared/config'
import { logger } from '../../logger'
import type { APIErrorData, APIMessage, APIRequests, PluginInfo } from './api'
import { readToken, writeToken } from './token'

type Endpoint = Pick<VTSThrowConfig, 'host' | 'port'>

/** `pluginName` and `pluginDeveloper` must match between token and auth. */
const PLUGIN: PluginInfo = {
  pluginName: 'EasyDonate Connect',
  pluginDeveloper: 'EasyDonate',
}

const CONNECT_TIMEOUT = 5000
const REQUEST_TIMEOUT = 10_000
// Token and permission requests that show a popup only answer once the user
// clicks Allow or Deny in VTube Studio
const APPROVAL_TIMEOUT = 120_000

export class VTSError extends Error {
  readonly errorID: number

  constructor({ errorID, message }: APIErrorData) {
    super(`${message} (error ${errorID})`)
    this.name = 'VTSError'
    this.errorID = errorID
  }
}

export type VTSSession = {
  request: <K extends keyof APIRequests>(
    messageType: K,
    data: APIRequests[K]['data'],
    timeout?: number
  ) => Promise<APIRequests[K]['response']>
  close: () => void
}

type PendingRequest = {
  resolve: (message: APIMessage) => void
  reject: (error: Error) => void
  timer: ReturnType<typeof setTimeout>
}

const openSocket = async ({ host, port }: Endpoint) => {
  const socket = new WebSocket(`ws://${host}:${port}`)
  const { promise, resolve, reject } = Promise.withResolvers<WebSocket>()
  const fail = () =>
    reject(
      new Error(
        `Cannot connect to VTube Studio at ${host}:${port}. Is "Allow Plugin API access" on and the port right?`
      )
    )

  socket.addEventListener('open', () => resolve(socket), { once: true })
  socket.addEventListener('error', fail, { once: true })
  const timer = setTimeout(fail, CONNECT_TIMEOUT)

  try {
    return await promise
  } catch (error) {
    socket.close()
    throw error
  } finally {
    clearTimeout(timer)
  }
}

const createSession = (socket: WebSocket): VTSSession => {
  const pending = new Map<string, PendingRequest>()

  socket.addEventListener('message', event => {
    let message: APIMessage
    try {
      message = JSON.parse(String(event.data))
    } catch {
      return
    }

    // Messages without a pending request (e.g. events) are ignored
    const { requestID } = message
    const entry = requestID ? pending.get(requestID) : undefined
    if (!requestID || !entry) {
      return
    }

    pending.delete(requestID)
    clearTimeout(entry.timer)

    if (message.messageType === 'APIError') {
      // SAFETY: VTube Studio always sends `APIError` with this data shape
      entry.reject(new VTSError(message.data as APIErrorData))
    } else {
      entry.resolve(message)
    }
  })

  socket.addEventListener('close', () => {
    for (const entry of pending.values()) {
      clearTimeout(entry.timer)
      entry.reject(new Error('Connection to VTube Studio closed'))
    }
    pending.clear()
  })

  const request: VTSSession['request'] = async (
    messageType,
    data,
    timeout = REQUEST_TIMEOUT
  ) => {
    if (socket.readyState !== WebSocket.OPEN) {
      throw new Error('Connection to VTube Studio closed')
    }

    const requestID = crypto.randomUUID()
    const { promise, resolve, reject } = Promise.withResolvers<APIMessage>()
    const timer = setTimeout(() => {
      pending.delete(requestID)
      reject(new Error(`${messageType} timed out`))
    }, timeout)

    pending.set(requestID, { resolve, reject, timer })
    socket.send(
      JSON.stringify({
        apiName: 'VTubeStudioPublicAPI',
        apiVersion: '1.0',
        requestID,
        messageType,
        data,
      })
    )

    const response = await promise
    // SAFETY: VTube Studio answers `messageType` with its documented response
    return response.data as APIRequests[typeof messageType]['response']
  }

  return { request, close: () => socket.close() }
}

const authenticateWith = async (session: VTSSession, token: string) => {
  const { authenticated } = await session.request('AuthenticationRequest', {
    ...PLUGIN,
    authenticationToken: token,
  })

  return authenticated
}

// VTube Studio shows one approval popup at a time, so sessions that need a
// token while one is being requested wait for that request
let tokenRequest: Promise<string> | undefined

const fetchToken = async (session: VTSSession) => {
  logger.info('[VTS] Waiting for approval in VTube Studio')
  try {
    const { authenticationToken } = await session.request(
      'AuthenticationTokenRequest',
      PLUGIN,
      APPROVAL_TIMEOUT
    )
    writeToken(authenticationToken)

    return authenticationToken
  } finally {
    tokenRequest = undefined
  }
}

// Asks the user for a new token when the saved one is missing or revoked
const authenticate = async (session: VTSSession) => {
  const savedToken = readToken()

  if (savedToken && (await authenticateWith(session, savedToken))) {
    return
  }

  tokenRequest ??= fetchToken(session)

  if (!(await authenticateWith(session, await tokenRequest))) {
    throw new Error('VTube Studio rejected the plugin token')
  }
}

let permissionRequest: Promise<void> | undefined

const fetchCustomImagePermission = async (session: VTSSession) => {
  try {
    const { permissions } = await session.request(
      'PermissionRequest',
      { requestedPermission: 'LoadCustomImagesAsItems' },
      APPROVAL_TIMEOUT
    )
    const isGranted = permissions.some(
      permission =>
        permission.name === 'LoadCustomImagesAsItems' && permission.granted
    )

    if (!isGranted) {
      throw new Error('Custom images are not allowed in VTube Studio')
    }
  } finally {
    permissionRequest = undefined
  }
}

// VTube Studio answers at once when allowed before, and with a popup otherwise
export const allowCustomImages = (session: VTSSession) => {
  permissionRequest ??= fetchCustomImagePermission(session)

  return permissionRequest
}

export const withVTSSession = async <T>(
  endpoint: Endpoint,
  run: (session: VTSSession) => Promise<T>
) => {
  const session = createSession(await openSocket(endpoint))

  try {
    await authenticate(session)
    return await run(session)
  } finally {
    session.close()
  }
}
