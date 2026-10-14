import { log } from '~/libs/logs'
import { getPlatform } from '~/libs/rpc'

const loadPlatform = async () => {
  try {
    return await getPlatform()
  } catch (error) {
    log.warn(
      `Failed to read the platform, showing every output: ${error instanceof Error ? error.message : 'unknown error'}`
    )

    return null
  }
}

/**
 * The main process's `process.platform`, or `null` if it can't be read. It
 * starts loading once at startup, so `use` gets the same promise on every
 * render.
 */
export const platformPromise = loadPlatform()
