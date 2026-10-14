import { logger } from '../../logger'
import type { VTSSession } from './client'

type Axis = 'x' | 'y'

type Spring = { position: number; velocity: number }

/**
 * Tracking inputs the head's displacement adds to, and degrees (or position
 * units) per unit of displacement. The model's own Live2D physics (hair,
 * accessories) follow the head, so they swing too. Flip a gain's sign if the
 * model moves toward the item instead of away from it.
 */
const PARAMETERS: { id: string; axis: Axis; gain: number }[] = [
  { id: 'FaceAngleX', axis: 'x', gain: 25 },
  { id: 'FaceAngleZ', axis: 'x', gain: 15 },
  { id: 'FacePositionX', axis: 'x', gain: 5 },
  { id: 'FaceAngleY', axis: 'y', gain: 15 },
]

const TICK = 0.033

/** Longest step integrated at once, so a slow response can't fling the head */
const MAX_STEP = 0.05
const FREQUENCY = 2 * Math.PI * 1.6

/** Below 1, so the head overshoots and wobbles back a few times */
const DAMPING_RATIO = 0.3

/**
 * Velocity one hit gives at strength 1. The displacement then peaks near 0.6.
 */
const IMPULSE = 6
const MAX_DISPLACEMENT = 1.5
const REST_POSITION = 0.002
const REST_VELOCITY = 0.02

const sleep = (seconds: number) => Bun.sleep(seconds * 1000)

const stepSpring = (spring: Spring, seconds: number) => {
  const acceleration =
    -(FREQUENCY ** 2) * spring.position -
    2 * DAMPING_RATIO * FREQUENCY * spring.velocity

  spring.velocity += acceleration * seconds
  spring.position += spring.velocity * seconds

  if (Math.abs(spring.position) > MAX_DISPLACEMENT) {
    spring.position = Math.sign(spring.position) * MAX_DISPLACEMENT
    spring.velocity = 0
  }
}

const isAtRest = (spring: Spring) =>
  Math.abs(spring.position) < REST_POSITION &&
  Math.abs(spring.velocity) < REST_VELOCITY

/**
 * Knocks the model's head away from each item that hits it, on a damped
 * spring. It adds to the tracking inputs in `add` mode, so face tracking keeps
 * working and overlapping donations add up instead of failing. `strength` 0
 * turns it off.
 */
export const createHitReaction = (session: VTSSession, strength: number) => {
  const springs: Record<Axis, Spring> = {
    x: { position: 0, velocity: 0 },
    y: { position: 0, velocity: 0 },
  }

  let loop: Promise<void> | undefined
  let hasFailed = false

  const isSettled = () => isAtRest(springs.x) && isAtRest(springs.y)

  const inject = (isFinal: boolean) =>
    session.request('InjectParameterDataRequest', {
      mode: 'add',
      parameterValues: PARAMETERS.map(({ id, axis, gain }) => ({
        id,
        value: isFinal ? 0 : springs[axis].position * gain,
      })),
    })

  // Each update waits for VTube Studio's answer, so a slow VTube Studio
  // can't build up a backlog
  const run = async () => {
    let last = performance.now()

    do {
      await inject(false)
      await sleep(TICK)
      const now = performance.now()
      const seconds = Math.min((now - last) / 1000, MAX_STEP)
      last = now
      stepSpring(springs.x, seconds)
      stepSpring(springs.y, seconds)

      // VTube Studio keeps an added value for a second after the last send,
      // so a final 0 clears it at once
      if (isSettled()) {
        await inject(true)
      }
    } while (!isSettled())
  }

  const start = () => {
    loop = (async () => {
      try {
        await run()
      } catch (error) {
        hasFailed = true
        logger.warn(
          '[VTS] Hit reaction stopped',
          error instanceof Error ? error : undefined
        )
      } finally {
        loop = undefined

        // A hit landed between the last settled check and `loop = undefined`
        if (!hasFailed && !isSettled()) {
          start()
        }
      }
    })()
  }

  return {
    /** `dx` and `dy` are the item's direction of travel, -1 to 1. */
    hit: (dx: number, dy: number) => {
      if (strength === 0 || hasFailed) {
        return
      }

      springs.x.velocity += dx * IMPULSE * strength
      springs.y.velocity += dy * IMPULSE * strength

      if (!loop) {
        start()
      }
    },
    settled: async () => {
      // A restart sets a new `loop` before the previous one resolves, so wait
      // until no loop is left
      for (let current = loop; current; current = loop) {
        await current
      }
    },
  }
}

export type HitReaction = ReturnType<typeof createHitReaction>
