import { z } from 'zod/mini'

import type { Messages } from './i18n'

export const PORT_RANGE = { min: 1, max: 65_535, integer: true } as const
export const MIDI_CHANNEL_RANGE = { min: 1, max: 16, integer: true } as const

export const VTS_THROW_RANGES = {
  /** 0 is the smallest item size and 1 the biggest */
  size: { min: 0.05, max: 1, integer: false },
  /** Seconds from the screen edge to the model */
  flightTime: { min: 0.1, max: 2, integer: false },
  spin: { min: 0, max: 360, integer: false },
  /** Seconds to fade in when thrown and out after the hit */
  fadeTime: { min: 0, max: 2, integer: false },
  /** How hard each hit knocks the model's head; 0 turns it off */
  hitForce: { min: 0, max: 3, integer: false },
  hitVolume: { min: 0, max: 100, integer: true },
} as const

export const VTS_RULE_RANGES = {
  minAmount: { min: 0, max: 1_000_000, integer: false },
  /** VTube Studio fits about 60 items, the user's own included */
  count: { min: 1, max: 20, integer: true },
} as const

export const VTS_ZONE_OFFSET_RANGE = {
  min: -1000,
  max: 1000,
  integer: true,
} as const

export const VTS_ZONE_WIDTH_RANGE = {
  min: 0,
  max: 2000,
  integer: true,
} as const

export const VTS_HIT_ZONES = ['head', 'body', 'feet'] as const

export const VTS_THROW_DIRECTIONS = ['left', 'right'] as const

/**
 * Sounds the app plays when an item hits the model, each a set of takes in
 * `mainview/sounds`. VTube Studio's API can't play audio.
 */
export const VTS_HIT_SOUNDS = [
  'none',
  'punch',
  'soft',
  'wood',
  'metal',
  'glass',
  'bell',
] as const

export type VTSHitZone = (typeof VTS_HIT_ZONES)[number]

export type VTSThrowDirection = (typeof VTS_THROW_DIRECTIONS)[number]

export type VTSHitSound = (typeof VTS_HIT_SOUNDS)[number]

export type VTSThrowRangeKey = keyof typeof VTS_THROW_RANGES

export type VTSRuleRangeKey = keyof typeof VTS_RULE_RANGES

// SAFETY: `Object.keys` lists exactly the keys of the literal above
const VTS_THROW_RANGE_KEYS = Object.keys(VTS_THROW_RANGES) as VTSThrowRangeKey[]

type Range = { min: number; max: number; integer: boolean }

export const VTS_IMAGES_DIR = 'vts-images'
export const VTS_SOUNDS_DIR = 'vts-sounds'

// `z.catch`, renamed so the promise lint rules don't mistake it for a promise
// `.catch`. Read as a member, not destructured: destructuring `z` keeps every
// zod export, locales and JSON Schema included, in both bundles
const withFallback = z.catch

const withDefaults = <T extends z.ZodMiniType>(schema: T) =>
  withFallback(schema, () => schema.parse({}))

const listOf = <T extends z.ZodMiniType>(
  schema: T,
  fallback: () => unknown[] = () => []
) =>
  z.pipe(
    withFallback(z.array(z.unknown()), fallback),
    z.transform(values =>
      values.flatMap(value => {
        const result = schema.safeParse(value)

        return result.success ? [result.data] : []
      })
    )
  )

const rangeSchema = ({ min, max, integer }: Range) =>
  (integer ? z.int() : z.number()).check(z.minimum(min), z.maximum(max))

const createId = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(8)), byte =>
    byte.toString(16).padStart(2, '0')
  ).join('')

const HostSchema = z.string().check(z.trim(), z.minLength(1))
const PortSchema = rangeSchema(PORT_RANGE)
const MIDIChannelSchema = rangeSchema(MIDI_CHANNEL_RANGE)

const VTS_THROW_VALUE_SCHEMAS = {
  size: rangeSchema(VTS_THROW_RANGES.size),
  flightTime: rangeSchema(VTS_THROW_RANGES.flightTime),
  spin: rangeSchema(VTS_THROW_RANGES.spin),
  fadeTime: rangeSchema(VTS_THROW_RANGES.fadeTime),
  hitForce: rangeSchema(VTS_THROW_RANGES.hitForce),
  hitVolume: rangeSchema(VTS_THROW_RANGES.hitVolume),
}

const VTS_RULE_VALUE_SCHEMAS = {
  minAmount: rangeSchema(VTS_RULE_RANGES.minAmount),
  count: rangeSchema(VTS_RULE_RANGES.count),
}

const ZoneOffsetSchema = rangeSchema(VTS_ZONE_OFFSET_RANGE)
const ZoneWidthSchema = rangeSchema(VTS_ZONE_WIDTH_RANGE)

const ZoneDirectionsSchema = z.pipe(
  listOf(z.enum(VTS_THROW_DIRECTIONS)),
  z.transform(directions =>
    directions.length > 0
      ? VTS_THROW_DIRECTIONS.filter(direction => directions.includes(direction))
      : [...VTS_THROW_DIRECTIONS]
  )
)

const OSCConfigSchema = z.object({
  enabled: withFallback(z.boolean(), false),
  host: withFallback(HostSchema, '127.0.0.1'),
  port: withFallback(PortSchema, 9000),
})

const MIDIConfigSchema = z.object({
  enabled: withFallback(z.boolean(), false),
  deviceName: withFallback(z.string().check(z.trim()), ''),
  channel: withFallback(MIDIChannelSchema, 1),
})

const VTSCustomImageSchema = z.object({
  fileName: z
    .string()
    .check(z.regex(/^(?:ezdn-)?[\da-f]{8}\.(?:gif|jpg|png)$/u)),
  name: z.string(),
})

const VTSCustomSoundSchema = z.object({
  fileName: z
    .string()
    .check(z.regex(/^(?:ezdn-)?[\da-f]{8}\.(?:mp3|ogg|wav)$/u)),
  name: z.string(),
})

const VTSThrowRuleSchema = z.object({
  id: withFallback(z.string().check(z.minLength(1)), () => createId()),
  minAmount: withFallback(VTS_RULE_VALUE_SCHEMAS.minAmount, 0),
  count: withFallback(VTS_RULE_VALUE_SCHEMAS.count, 1),
  custom: withFallback(z.boolean(), false),
  items: listOf(z.string()),
  images: listOf(z.string()),
  zones: z.pipe(
    listOf(z.enum(VTS_HIT_ZONES)),
    z.transform(zones =>
      zones.length > 0
        ? VTS_HIT_ZONES.filter(zone => zones.includes(zone))
        : [...VTS_HIT_ZONES]
    )
  ),
  zoneOffsets: withDefaults(
    z.object({
      head: withFallback(ZoneOffsetSchema, 0),
      body: withFallback(ZoneOffsetSchema, 0),
      feet: withFallback(ZoneOffsetSchema, 0),
    })
  ),
  zoneWidths: withDefaults(
    z.object({
      head: withFallback(ZoneWidthSchema, 300),
      body: withFallback(ZoneWidthSchema, 300),
      feet: withFallback(ZoneWidthSchema, 300),
    })
  ),
  zoneDirections: withDefaults(
    z.object({
      head: ZoneDirectionsSchema,
      body: ZoneDirectionsSchema,
      feet: ZoneDirectionsSchema,
    })
  ),
})

const VTSThrowConfigSchema = z.pipe(
  z.object({
    enabled: withFallback(z.boolean(), false),
    host: withFallback(HostSchema, '127.0.0.1'),
    port: withFallback(PortSchema, 8001),
    items: listOf(z.string().check(z.trim(), z.minLength(1))),
    customImages: listOf(VTSCustomImageSchema),
    customSounds: listOf(VTSCustomSoundSchema),
    rules: listOf(VTSThrowRuleSchema),
    size: withFallback(VTS_THROW_VALUE_SCHEMAS.size, 0.32),
    flightTime: withFallback(VTS_THROW_VALUE_SCHEMAS.flightTime, 0.45),
    spin: withFallback(VTS_THROW_VALUE_SCHEMAS.spin, 90),
    fadeTime: withFallback(VTS_THROW_VALUE_SCHEMAS.fadeTime, 0),
    hitForce: withFallback(VTS_THROW_VALUE_SCHEMAS.hitForce, 1),
    hitSound: withFallback(z.string(), 'punch'),
    hitVolume: withFallback(VTS_THROW_VALUE_SCHEMAS.hitVolume, 50),
  }),
  z.transform(config => {
    const imageNames = new Set(config.customImages.map(image => image.fileName))

    const soundNames = new Set<string>([
      ...VTS_HIT_SOUNDS,
      ...config.customSounds.map(sound => sound.fileName),
    ])

    const rules =
      config.rules.length > 0 ? config.rules : [VTSThrowRuleSchema.parse({})]

    // `sendDonationVTS` expects the rules sorted by `minAmount`
    return {
      ...config,
      hitSound: soundNames.has(config.hitSound) ? config.hitSound : 'punch',
      rules: rules
        .map(rule => ({
          ...rule,
          items: rule.items.filter(item => config.items.includes(item)),
          images: rule.images.filter(image => imageNames.has(image)),
        }))
        .toSorted((a, b) => a.minAmount - b.minAmount),
    }
  })
)

/**
 * Heals a config from disk or RPC. An invalid field falls back to its default
 * without resetting the rest, and the schema drops unknown fields.
 */
export const ConfigSchema = withDefaults(
  z.object({
    widgetUrl: withFallback(z.string().check(z.trim()), ''),
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

export type VTSCustomSound = z.output<typeof VTSCustomSoundSchema>

export type VTSThrowRule = z.output<typeof VTSThrowRuleSchema>

export type VTSThrowConfig = z.output<typeof VTSThrowConfigSchema>

export type Config = z.output<typeof ConfigSchema>

export const createDefaultConfig = (): Config => ConfigSchema.parse({})

export const createVTSThrowRule = (rule: Partial<VTSThrowRule> = {}) =>
  VTSThrowRuleSchema.parse(rule)

// `appdata://` serves `userData` to the main window, which enables it in
// `allowedProtocols`
export const getVTSImageUrl = ({ fileName }: VTSCustomImage) =>
  `appdata://${VTS_IMAGES_DIR}/${encodeURIComponent(fileName)}`

export const isVTSSoundFileName = (fileName: string) =>
  VTSCustomSoundSchema.shape.fileName.safeParse(fileName).success

/** A message for each invalid field, keyed by its path in the config form. */
export type ConfigErrors = Record<string, string>

const formatRange = ({ min, max }: Range, messages: Messages) =>
  messages.app.form.range({ min: `${min}`, max: max.toLocaleString() })

const fits = <T extends z.ZodMiniType>(schema: T, value: z.input<T>) =>
  schema.safeParse(value).success

/**
 * Checks the config in the form. Where `ConfigSchema` heals a bad value, this
 * reports it. It also runs the checks that span fields.
 */
export const validateConfig = ({ vrc, vts }: Config, messages: Messages) => {
  const errors: ConfigErrors = {}
  const { osc, midi } = vrc
  const vtsThrow = vts.throw
  const { form } = messages.app
  const hasItems = vtsThrow.items.length + vtsThrow.customImages.length > 0

  const portRange = form.range({
    min: `${PORT_RANGE.min}`,
    max: `${PORT_RANGE.max}`,
  })

  // `formatRange` would read -1000-1,000
  const zoneOffsetRange = form.signedRange({
    min: VTS_ZONE_OFFSET_RANGE.min.toLocaleString(),
    max: VTS_ZONE_OFFSET_RANGE.max.toLocaleString(),
  })

  const check = (path: string, isValid: boolean, message: string) => {
    if (!isValid) {
      errors[path] ??= message
    }
  }

  check('vrc.osc.host', fits(HostSchema, osc.host), form.enterHost)
  check('vrc.osc.port', fits(PortSchema, osc.port), portRange)
  check(
    'vrc.midi.deviceName',
    !midi.enabled || midi.deviceName.trim() !== '',
    form.selectDevice
  )
  check(
    'vrc.midi.channel',
    fits(MIDIChannelSchema, midi.channel),
    formatRange(MIDI_CHANNEL_RANGE, messages)
  )
  check('vts.throw.host', fits(HostSchema, vtsThrow.host), form.enterHost)
  check('vts.throw.port', fits(PortSchema, vtsThrow.port), portRange)
  check('vts.throw.items', !vtsThrow.enabled || hasItems, form.selectItems)

  for (const key of VTS_THROW_RANGE_KEYS) {
    check(
      `vts.throw.${key}`,
      fits(VTS_THROW_VALUE_SCHEMAS[key], vtsThrow[key]),
      formatRange(VTS_THROW_RANGES[key], messages)
    )
  }

  for (const [index, rule] of vtsThrow.rules.entries()) {
    const path = `vts.throw.rules.${index}`
    const pickedCount = rule.items.length + rule.images.length

    check(
      `${path}.minAmount`,
      fits(VTS_RULE_VALUE_SCHEMAS.minAmount, rule.minAmount),
      formatRange(VTS_RULE_RANGES.minAmount, messages)
    )
    // With two rules at the same Min THB, it's unclear which one a donation
    // uses
    check(
      `${path}.minAmount`,
      vtsThrow.rules.every(
        other => other.id === rule.id || other.minAmount !== rule.minAmount
      ),
      form.duplicateMinAmount
    )
    check(
      `${path}.count`,
      fits(VTS_RULE_VALUE_SCHEMAS.count, rule.count),
      formatRange(VTS_RULE_RANGES.count, messages)
    )
    check(
      `${path}.items`,
      !vtsThrow.enabled || (rule.custom ? pickedCount > 0 : hasItems),
      rule.custom ? form.chooseCustomItems : form.selectRuleItems
    )
    check(`${path}.zones`, rule.zones.length > 0, form.chooseZones)

    // An unchecked zone's settings are grayed out, so they can't block Save,
    // and `ConfigSchema` heals them on save
    for (const zone of rule.zones) {
      check(
        `${path}.zoneDirections.${zone}`,
        rule.zoneDirections[zone].length > 0,
        ''
      )
      check(
        `${path}.zoneOffsets.${zone}`,
        fits(ZoneOffsetSchema, rule.zoneOffsets[zone]),
        zoneOffsetRange
      )
      check(
        `${path}.zoneWidths.${zone}`,
        fits(ZoneWidthSchema, rule.zoneWidths[zone]),
        formatRange(VTS_ZONE_WIDTH_RANGE, messages)
      )
    }
  }

  return errors
}
