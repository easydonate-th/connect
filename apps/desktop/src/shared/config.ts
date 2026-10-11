import { z } from 'zod'

export const PORT_RANGE = { min: 1, max: 65_535, integer: true } as const
export const MIDI_CHANNEL_RANGE = { min: 1, max: 16, integer: true } as const
export const VTS_THROW_RANGES = {
  /** Item size: 0 is smallest, 1 biggest, 0.32 the default */
  size: { min: 0.05, max: 1, integer: false },
  /** Seconds from the screen edge to the model */
  flightTime: { min: 0.1, max: 2, integer: false },
  /** Degrees the item turns on its way in */
  spin: { min: 0, max: 360, integer: false },
  /** Seconds to fade in when thrown and out after the hit */
  fadeTime: { min: 0, max: 2, integer: false },
  /** How hard each hit knocks the model's head; 0 turns it off */
  hitForce: { min: 0, max: 3, integer: false },
} as const
export const VTS_RULE_RANGES = {
  minAmount: { min: 0, max: 1_000_000, integer: false },
  /** VTube Studio fits about 60 items, the user's own included */
  count: { min: 1, max: 20, integer: true },
} as const

/** Parts of the model an item can hit, from the top down */
export const VTS_HIT_ZONES = ['head', 'body', 'feet'] as const

export type VTSHitZone = (typeof VTS_HIT_ZONES)[number]
export type VTSThrowRangeKey = keyof typeof VTS_THROW_RANGES
export type VTSRuleRangeKey = keyof typeof VTS_RULE_RANGES

// SAFETY: `Object.keys` lists exactly the keys of the literal above
const VTS_THROW_RANGE_KEYS = Object.keys(VTS_THROW_RANGES) as VTSThrowRangeKey[]

type Range = { min: number; max: number; integer: boolean }

export const VTS_IMAGES_DIR = 'vts-images'

// `z.catch`, renamed so it doesn't read as a promise `.catch`
const { catch: withFallback } = z

const withDefaults = <T extends z.ZodType>(schema: T) =>
  withFallback(schema, () => schema.parse({}))

/** Drops the elements `schema` rejects instead of failing the whole array. */
const listOf = <T extends z.ZodType>(
  schema: T,
  fallback: () => unknown[] = () => []
) =>
  withFallback(z.array(z.unknown()), fallback).transform(values =>
    values.flatMap(value => {
      const result = schema.safeParse(value)

      return result.success ? [result.data] : []
    })
  )

const rangeSchema = ({ min, max, integer }: Range) =>
  (integer ? z.int() : z.number()).min(min).max(max)

/** `crypto.randomUUID` needs a secure context, which `views://` may not be */
const createId = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(8)), byte =>
    byte.toString(16).padStart(2, '0')
  ).join('')

const HostSchema = z.string().trim().min(1)
const PortSchema = rangeSchema(PORT_RANGE)
const MIDIChannelSchema = rangeSchema(MIDI_CHANNEL_RANGE)
const VTS_THROW_VALUE_SCHEMAS = {
  size: rangeSchema(VTS_THROW_RANGES.size),
  flightTime: rangeSchema(VTS_THROW_RANGES.flightTime),
  spin: rangeSchema(VTS_THROW_RANGES.spin),
  fadeTime: rangeSchema(VTS_THROW_RANGES.fadeTime),
  hitForce: rangeSchema(VTS_THROW_RANGES.hitForce),
}
const VTS_RULE_VALUE_SCHEMAS = {
  minAmount: rangeSchema(VTS_RULE_RANGES.minAmount),
  count: rangeSchema(VTS_RULE_RANGES.count),
}

// Every field falls back to its default on its own, so one bad value in
// config.json never resets the rest of the config.
const OSCConfigSchema = z.object({
  enabled: withFallback(z.boolean(), false),
  // VRChat listens for OSC input on 127.0.0.1:9000 by default
  host: withFallback(HostSchema, '127.0.0.1'),
  port: withFallback(PortSchema, 9000),
})

const MIDIConfigSchema = z.object({
  enabled: withFallback(z.boolean(), false),
  deviceName: withFallback(z.string().trim(), ''),
  /** 1-16, as shown in most MIDI tools */
  channel: withFallback(MIDIChannelSchema, 1),
})

const VTSCustomImageSchema = z.object({
  // The format `importVTSImages` gives, which also keeps the path inside
  // `userData/vts-images`
  fileName: z.string().regex(/^ezdn-[\da-f]{8}\.(?:gif|jpg|png)$/u),
  /** The original file name, for display */
  name: z.string(),
})

/**
 * Throws `count` items at a donation of at least `minAmount` THB, each picked
 * at random from the config's `items` and `customImages`, or with `custom`
 * from the rule's own `items` and `images`, at one of its `zones`. A donation
 * uses the rule with the highest `minAmount` it reaches, and throws nothing
 * below every rule.
 */
const VTSThrowRuleSchema = z.object({
  /** Stable React key */
  id: withFallback(z.string().min(1), () => createId()),
  minAmount: withFallback(VTS_RULE_VALUE_SCHEMAS.minAmount, 0),
  count: withFallback(VTS_RULE_VALUE_SCHEMAS.count, 1),
  custom: withFallback(z.boolean(), false),
  /** Picks from the config's `items` */
  items: listOf(z.string()),
  /** Picks from the config's `customImages`, by `fileName` */
  images: listOf(z.string()),
  /** Each item hits one of these at random; none falls back to all */
  zones: listOf(z.enum(VTS_HIT_ZONES)).transform(zones =>
    zones.length > 0
      ? VTS_HIT_ZONES.filter(zone => zones.includes(zone))
      : [...VTS_HIT_ZONES]
  ),
})

const VTSThrowConfigSchema = z
  .object({
    enabled: withFallback(z.boolean(), false),
    host: withFallback(HostSchema, '127.0.0.1'),
    port: withFallback(PortSchema, 8001),
    /** Selected files from VTube Studio's `Items` folder */
    items: listOf(z.string().trim().min(1)),
    customImages: listOf(VTSCustomImageSchema),
    rules: listOf(VTSThrowRuleSchema),
    size: withFallback(VTS_THROW_VALUE_SCHEMAS.size, 0.32),
    flightTime: withFallback(VTS_THROW_VALUE_SCHEMAS.flightTime, 0.45),
    spin: withFallback(VTS_THROW_VALUE_SCHEMAS.spin, 90),
    fadeTime: withFallback(VTS_THROW_VALUE_SCHEMAS.fadeTime, 0),
    hitForce: withFallback(VTS_THROW_VALUE_SCHEMAS.hitForce, 1),
  })
  .transform(config => {
    const imageNames = new Set(config.customImages.map(image => image.fileName))
    // There is always a rule; without any, it throws an item at every donation
    const rules =
      config.rules.length > 0 ? config.rules : [VTSThrowRuleSchema.parse({})]

    // `sendDonationVTS` relies on rules being sorted by `minAmount`
    return {
      ...config,
      rules: rules
        .map(rule => ({
          ...rule,
          items: rule.items.filter(item => config.items.includes(item)),
          images: rule.images.filter(image => imageNames.has(image)),
        }))
        .toSorted((a, b) => a.minAmount - b.minAmount),
    }
  })

/**
 * Heals a config from disk or RPC: an invalid field falls back to its default
 * without resetting the rest, and unknown fields are dropped.
 */
export const ConfigSchema = withDefaults(
  z.object({
    widgetUrl: withFallback(z.string().trim(), ''),
    autoConnect: withFallback(z.boolean(), false),
    vrc: withDefaults(
      z.object({
        osc: withDefaults(OSCConfigSchema),
        midi: withDefaults(MIDIConfigSchema),
      })
    ),
    vts: withDefaults(
      z.object({
        throw: withDefaults(VTSThrowConfigSchema),
      })
    ),
  })
)

export type OSCConfig = z.output<typeof OSCConfigSchema>
export type MIDIConfig = z.output<typeof MIDIConfigSchema>
export type VTSCustomImage = z.output<typeof VTSCustomImageSchema>
export type VTSThrowRule = z.output<typeof VTSThrowRuleSchema>
export type VTSThrowConfig = z.output<typeof VTSThrowConfigSchema>
export type Config = z.output<typeof ConfigSchema>

export const createDefaultConfig = (): Config => ConfigSchema.parse({})

export const createVTSThrowRule = (rule: Partial<VTSThrowRule> = {}) =>
  VTSThrowRuleSchema.parse(rule)

/**
 * URL the webview loads an added image from. `appdata://` serves `userData`
 * to the main window, which enables it in `allowedProtocols`.
 */
export const getVTSImageUrl = ({ fileName }: VTSCustomImage) =>
  `appdata://${VTS_IMAGES_DIR}/${encodeURIComponent(fileName)}`

export const isValidHost = (host: string) => HostSchema.safeParse(host).success

export const isValidPort = (port: number) => PortSchema.safeParse(port).success

export const isValidMIDIChannel = (channel: number) =>
  MIDIChannelSchema.safeParse(channel).success

export const isValidVTSThrowValue = (key: VTSThrowRangeKey, value: number) =>
  VTS_THROW_VALUE_SCHEMAS[key].safeParse(value).success

export const isValidVTSRuleValue = (key: VTSRuleRangeKey, value: number) =>
  VTS_RULE_VALUE_SCHEMAS[key].safeParse(value).success

export const isValidMIDIDevice = ({ enabled, deviceName }: MIDIConfig) =>
  !enabled || deviceName.trim() !== ''

export const isValidVTSItems = ({
  enabled,
  items,
  customImages,
}: VTSThrowConfig) => !enabled || items.length + customImages.length > 0

export const isValidVTSRuleItems = (
  { custom, items, images }: VTSThrowRule,
  selectedItems: string[],
  customImages: VTSCustomImage[]
) =>
  (custom
    ? items.length + images.length
    : selectedItems.length + customImages.length) > 0

/** Two rules with one Min THB would leave the donation's rule ambiguous. */
export const isDuplicateVTSRuleAmount = (
  rule: VTSThrowRule,
  rules: VTSThrowRule[]
) =>
  rules.some(
    other => other.id !== rule.id && other.minAmount === rule.minAmount
  )

const isValidVTSRule = (rule: VTSThrowRule, rules: VTSThrowRule[]) =>
  isValidVTSRuleValue('minAmount', rule.minAmount) &&
  isValidVTSRuleValue('count', rule.count) &&
  rule.zones.length > 0 &&
  !isDuplicateVTSRuleAmount(rule, rules)

const isValidVTSRules = ({
  enabled,
  rules,
  items,
  customImages,
}: VTSThrowConfig) =>
  rules.every(rule => isValidVTSRule(rule, rules)) &&
  (!enabled ||
    rules.every(rule => isValidVTSRuleItems(rule, items, customImages)))

export const isValidConfig = ({ vrc, vts }: Config) =>
  isValidHost(vrc.osc.host) &&
  isValidPort(vrc.osc.port) &&
  isValidMIDIDevice(vrc.midi) &&
  isValidMIDIChannel(vrc.midi.channel) &&
  isValidHost(vts.throw.host) &&
  isValidPort(vts.throw.port) &&
  isValidVTSItems(vts.throw) &&
  isValidVTSRules(vts.throw) &&
  VTS_THROW_RANGE_KEYS.every(key => isValidVTSThrowValue(key, vts.throw[key]))
