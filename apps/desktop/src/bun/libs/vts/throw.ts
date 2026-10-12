import type {
  VTSCustomImage,
  VTSHitZone,
  VTSThrowDirection,
  VTSThrowConfig,
  VTSThrowRule,
} from '../../../shared/config'
import type { Donation } from '../../../shared/donation'
import { logger } from '../../logger'
import type { APIRequests, FadeMode } from './api'
import { allowCustomImages, VTSError, withVTSSession } from './client'
import type { VTSSession } from './client'
import { readVTSImage } from './images'
import { getModelBounds } from './outline'
import type { ModelBounds } from './outline'
import { createHitReaction } from './reaction'
import type { HitReaction } from './reaction'

type Choice =
  | { kind: 'item'; fileName: string }
  | { kind: 'image'; image: VTSCustomImage }

type Placement = Omit<APIRequests['ItemLoadRequest']['data'], 'fileName'>

type Move = {
  time: number
  fadeMode: FadeMode
  x: number
  y: number
  rotation: number
}

type ModelPosition = { positionX: number; positionY: number }

type Target = { model: ModelPosition; bounds: ModelBounds | null }

/** Screen edges are at -1 and 1, so the item starts just out of view. */
const START_X = 1.4
/** Below the bottom edge, where the item drops out after the hit. */
const DROP_Y = -1.6
const FLIGHT_FADE_MODE = 'easeIn'
const DROP = { time: 0.7, fadeMode: 'easeIn' } as const
/** Seconds between the items of one donation */
const STAGGER = 0.15
/** `ItemMoveRequest` leaves fields at this value or lower unchanged. */
const UNCHANGED = -1000
const ITEM_FILE_NAME_NOT_FOUND = 751
/** -1 throws from the left edge, 1 from the right */
const SIDES: Record<VTSThrowDirection, number> = { left: -1, right: 1 }
/**
 * Where items aimed at each zone land, as fractions of the model's visible
 * height from its top, and how hard a hit there knocks the head.
 */
const ZONES: Record<VTSHitZone, { from: number; to: number; force: number }> = {
  head: { from: 0.05, to: 0.2, force: 1 },
  body: { from: 0.25, to: 0.6, force: 0.6 },
  feet: { from: 0.85, to: 0.97, force: 0.3 },
}

const randomBetween = (min: number, max: number) =>
  min + Math.random() * (max - min)

const sleep = (seconds: number) => Bun.sleep(seconds * 1000)

const pickRandom = <T>(values: readonly T[]) =>
  values[Math.floor(Math.random() * values.length)]

const getChoiceName = (choice: Choice) =>
  choice.kind === 'item' ? choice.fileName : choice.image.name

const aimAt = (
  zone: VTSHitZone,
  rule: VTSThrowRule,
  { model, bounds }: Target
) => {
  const { from, to } = ZONES[zone]
  // Without an outline, every zone aims at the model's center, and there is
  // no window size to turn the zone's width and offset into item units with
  const halfWidth = bounds ? rule.zoneWidths[zone] / bounds.windowWidth : 0.15

  return {
    x: model.positionX + randomBetween(-halfWidth, halfWidth),
    y: bounds
      ? bounds.top -
        (bounds.top - bounds.bottom) * randomBetween(from, to) -
        // Pixels count down the screen, but item y counts up
        (rule.zoneOffsets[zone] * 2) / bounds.windowHeight
      : model.positionY + randomBetween(-0.15, 0.15),
  }
}

// Without `custom`, a rule picks from both tabs: every selected VTube Studio
// item and every imported image
const pickChoices = (rule: VTSThrowRule, config: VTSThrowConfig) => {
  const items = rule.custom ? rule.items : config.items
  const images = rule.custom
    ? config.customImages.filter(image => rule.images.includes(image.fileName))
    : config.customImages
  const choices: Choice[] = [
    ...items.map(fileName => ({ kind: 'item' as const, fileName })),
    ...images.map(image => ({ kind: 'image' as const, image })),
  ]

  if (choices.length === 0) {
    throw new Error(`No item selected in the ${rule.minAmount} THB rule`)
  }

  return Array.from({ length: rule.count }, () => pickRandom(choices))
}

// The names VTube Studio gave the custom images it loaded, by endpoint and
// image, or `null` when the upload failed. They load the image without
// sending its data again until VTube Studio restarts.
const loadedImageNames = new Map<string, Promise<string | null>>()

const forgetImageName = (key: string, name: Promise<string | null>) => {
  if (loadedImageNames.get(key) === name) {
    loadedImageNames.delete(key)
  }
}

const uploadImage = async (
  session: VTSSession,
  image: VTSCustomImage,
  placement: Placement
) =>
  session.request('ItemLoadRequest', {
    ...placement,
    fileName: image.fileName,
    customDataBase64: await readVTSImage(image),
    customDataAskUserFirst: false,
  })

const loadImage = async (
  session: VTSSession,
  { host, port }: VTSThrowConfig,
  image: VTSCustomImage,
  placement: Placement
) => {
  const key = `${host}:${port}/${image.fileName}`
  const cached = loadedImageNames.get(key)
  // When another throw's upload failed, `cachedName` is `null`, so this throw
  // uploads the image again
  const cachedName = cached && (await cached)

  if (cached && cachedName) {
    try {
      return await session.request('ItemLoadRequest', {
        ...placement,
        fileName: cachedName,
      })
    } catch (error) {
      if (
        !(error instanceof VTSError) ||
        error.errorID !== ITEM_FILE_NAME_NOT_FOUND
      ) {
        throw error
      }
      // VTube Studio restarted and cleared its copy
      forgetImageName(key, cached)
    }
  }

  const upload = uploadImage(session, image, placement)
  const name = (async () => {
    try {
      const { fileName } = await upload
      return fileName
    } catch {
      return null
    }
  })()

  // Stores the name before the upload finishes, so other throws of the same
  // image wait for it instead of sending the data again
  loadedImageNames.set(key, name)

  try {
    return await upload
  } catch (error) {
    forgetImageName(key, name)
    throw error
  }
}

const loadChoice = (
  session: VTSSession,
  config: VTSThrowConfig,
  choice: Choice,
  placement: Placement
) =>
  choice.kind === 'item'
    ? session.request('ItemLoadRequest', {
        ...placement,
        fileName: choice.fileName,
      })
    : loadImage(session, config, choice.image, placement)

const moveItem = async (
  session: VTSSession,
  itemInstanceID: string,
  move: Move
) => {
  const { movedItems } = await session.request('ItemMoveRequest', {
    itemsToMove: [
      {
        itemInstanceID,
        timeInSeconds: move.time,
        fadeMode: move.fadeMode,
        positionX: move.x,
        positionY: move.y,
        rotation: move.rotation,
        size: UNCHANGED,
        order: UNCHANGED,
        setFlip: false,
        flip: false,
        userCanStop: false,
      },
    ],
  })
  const [result] = movedItems

  if (result && !result.success) {
    throw new VTSError({
      errorID: result.errorID,
      message: 'Failed to move item',
    })
  }
}

/**
 * Flies one item at one of the rule's zones, from the side that zone allows,
 * knocks the model's head away from it, bounces it off and drops it.
 */
const throwItem = async (
  session: VTSSession,
  config: VTSThrowConfig,
  choice: Choice,
  rule: VTSThrowRule,
  aim: Target,
  reaction: HitReaction
) => {
  const { size, flightTime, spin, fadeTime } = config
  const zone = pickRandom(rule.zones)
  const side = SIDES[pickRandom(rule.zoneDirections[zone])]
  const target = aimAt(zone, rule, aim)

  const start = {
    x: side * START_X,
    y: target.y + randomBetween(-0.3, 0.3),
  }

  const { instanceID } = await loadChoice(session, config, choice, {
    positionX: start.x,
    positionY: start.y,
    size,
    rotation: 0,
    fadeTime,
    unloadWhenPluginDisconnects: true,
  })

  // Positive rotation is clockwise, so the item turns toward the model
  await moveItem(session, instanceID, {
    time: flightTime,
    fadeMode: FLIGHT_FADE_MODE,
    ...target,
    rotation: -side * spin,
  })
  await sleep(flightTime)
  // Dividing by the flight distance leaves a unit direction, so the hit's
  // strength is the zone's force, which is lower for zones farther from the
  // head
  const force =
    ZONES[zone].force / Math.hypot(target.x - start.x, target.y - start.y)
  reaction.hit((target.x - start.x) * force, (target.y - start.y) * force)

  // Unloading starts the fade-out, so the item fades while it drops
  await Promise.all([
    moveItem(session, instanceID, {
      ...DROP,
      x: target.x + side * 0.4,
      y: DROP_Y,
      rotation: -side * spin * 2,
    }),
    fadeTime > 0 &&
      session.request('ItemUnloadRequest', {
        unloadAllInScene: false,
        unloadAllLoadedByThisPlugin: false,
        allowUnloadingItemsLoadedByUserOrOtherPlugins: false,
        instanceIDs: [instanceID],
      }),
  ])
  await sleep(Math.max(DROP.time, fadeTime))
}

/**
 * Loads items with `unloadWhenPluginDisconnects`, so closing the session
 * removes them even when a step fails midway.
 */
export const sendDonationVTS = async (
  data: Donation,
  config: VTSThrowConfig
) => {
  const { host, port } = config
  // `ConfigSchema` sorts rules by `minAmount`, so this is the highest reached
  const rule = config.rules.findLast(
    ({ minAmount }) => minAmount <= data.amount
  )

  if (!rule) {
    logger.info(
      `[VTS] ${data.amount} THB is below every throw rule, nothing thrown`
    )

    return
  }

  const choices = pickChoices(rule, config)

  const thrown = await withVTSSession(config, async session => {
    const model = await session.request('CurrentModelRequest', {})

    if (!model.modelLoaded) {
      throw new Error('No model loaded in VTube Studio')
    }
    if (choices.some(choice => choice.kind === 'image')) {
      await allowCustomImages(session)
    }

    const aim = {
      model: model.modelPosition,
      bounds: await getModelBounds(session),
    }

    if (aim.bounds) {
      const { top, bottom } = aim.bounds
      logger.info(
        `[VTS] Model spans y ${bottom.toFixed(2)} to ${top.toFixed(2)}, positioned at y ${aim.model.positionY.toFixed(2)}`
      )
    }

    const reaction = createHitReaction(session, config.hitForce)
    const results = await Promise.allSettled(
      choices.map(async (choice, index) => {
        await sleep(index * STAGGER)
        await throwItem(session, config, choice, rule, aim, reaction)
      })
    )
    // Closing the session would cut the head's swing short
    await reaction.settled()
    const failures = results.flatMap((result, index) =>
      result.status === 'rejected'
        ? [{ choice: choices[index], reason: result.reason }]
        : []
    )

    if (failures.length === choices.length && failures[0]) {
      throw failures[0].reason
    }
    for (const { choice, reason } of failures) {
      logger.warn(
        `[VTS] Failed to throw ${getChoiceName(choice)}`,
        reason instanceof Error ? reason : undefined
      )
    }

    return choices.length - failures.length
  })

  logger.info(
    `[VTS] ${host}:${port} | Threw ${thrown} item${thrown === 1 ? '' : 's'}`
  )
}
