import type { RPCSchema } from 'electrobun/view'

import type { Config } from './config'
import type { Donation } from './donation'
import type { LogEntry } from './log'

/**
 * Typed RPC contract between the main process (`bun`) and the webview.
 * Each side lists the requests it answers and the messages it receives.
 */
export type AppRPC = {
  bun: RPCSchema<{
    requests: {
      getConfig: { params: undefined; response: Config }
      /** Persists the config and returns the normalized result */
      saveConfig: { params: Config; response: Config }
      /** Names of the MIDI output ports on this machine */
      getMIDIDevices: { params: undefined; response: string[] }
    }
    messages: {
      /** Fire-and-forget: forward a widget event to the enabled VRChat outputs */
      donation: Donation
    }
  }>
  webview: RPCSchema<{
    requests: Record<never, never>
    messages: {
      /** Main-process log line, shown in the Logs panel */
      log: LogEntry
    }
  }>
}
