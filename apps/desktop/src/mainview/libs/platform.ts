import { log } from '~/libs/logs'
import { getPlatform } from '~/libs/rpc'

import { describeError } from '../../shared/i18n/error'

const loadPlatform = async () => {
  try {
    return await getPlatform()
  } catch (error) {
    log.warn(
      `Failed to read the platform, showing every output: ${describeError(error) ?? 'unknown error'}`
    )

    return null
  }
}

/**
 * `null` if it can't be read. It starts loading once at startup, so `use` gets
 * the same promise on every render.
 */
export const platformPromise = loadPlatform()
