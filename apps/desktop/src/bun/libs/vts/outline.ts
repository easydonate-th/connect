import { logger } from '../../logger'
import type { VTSSession } from './client'

/** The top and bottom of the model's visible part, in item coordinates */
export type ModelBounds = { top: number; bottom: number }

/** VTube Studio sends the outline 15 times a second */
const OUTLINE_TIMEOUT = 1000

/**
 * Reads the model's bounds from one outline frame. Returns `null` when VTube
 * Studio sends no frame (versions before the event) or the model is out of
 * view.
 */
export const getModelBounds = async (
  session: VTSSession
): Promise<ModelBounds | null> => {
  try {
    // Waits before subscribing, since the first frame can arrive before the
    // subscription response
    const [{ convexHull }] = await Promise.all([
      session.waitForEvent('ModelOutlineEvent', OUTLINE_TIMEOUT),
      session.request('EventSubscriptionRequest', {
        eventName: 'ModelOutlineEvent',
        subscribe: true,
        config: { draw: false },
      }),
    ])
    const ys = convexHull.map(point => point.y)
    // Items can only hit the part on screen
    const top = Math.min(Math.max(...ys), 1)
    const bottom = Math.max(Math.min(...ys), -1)

    return top > bottom ? { top, bottom } : null
  } catch (error) {
    logger.warn(
      '[VTS] Cannot read the model outline, aiming at its center',
      error instanceof Error ? error : undefined
    )

    return null
  } finally {
    try {
      await session.request('EventSubscriptionRequest', {
        eventName: 'ModelOutlineEvent',
        subscribe: false,
      })
    } catch {
      // Closing the session ends the subscription anyway
    }
  }
}
