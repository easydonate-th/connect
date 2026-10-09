import { z } from 'zod'

import { withDefaults, withFallback } from './fallback'

export const OSC_PORT_RANGE = { min: 1, max: 65_535 } as const
export const MIDI_CHANNEL_RANGE = { min: 1, max: 16 } as const

const HostSchema = z.string().trim().min(1)
const PortSchema = z.int().min(OSC_PORT_RANGE.min).max(OSC_PORT_RANGE.max)
const MIDIChannelSchema = z
  .int()
  .min(MIDI_CHANNEL_RANGE.min)
  .max(MIDI_CHANNEL_RANGE.max)

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

const VRCConfigSchema = z.object({
  osc: withDefaults(OSCConfigSchema),
  midi: withDefaults(MIDIConfigSchema),
})

const ConfigSchema = withDefaults(
  z.object({
    widgetUrl: withFallback(z.string().trim(), ''),
    /** Connect to the saved widget URL when the app starts */
    autoConnect: withFallback(z.boolean(), false),
    vrc: withDefaults(VRCConfigSchema),
  })
)

export type OSCConfig = z.output<typeof OSCConfigSchema>
export type MIDIConfig = z.output<typeof MIDIConfigSchema>
export type Config = z.output<typeof ConfigSchema>

/**
 * Coerces a config loaded from disk or received over RPC into a valid
 * `Config`, falling back to defaults field by field.
 */
export const normalizeConfig = (input: Config): Config =>
  ConfigSchema.parse(input)

export const createDefaultConfig = (): Config => ConfigSchema.parse({})

export const isValidOSCHost = (host: string) =>
  HostSchema.safeParse(host).success

export const isValidOSCPort = (port: number) =>
  PortSchema.safeParse(port).success

export const isValidMIDIChannel = (channel: number) =>
  MIDIChannelSchema.safeParse(channel).success

/** True when every field would survive `normalizeConfig` unchanged. */
export const isValidConfig = ({ vrc }: Config) =>
  isValidOSCHost(vrc.osc.host) &&
  isValidOSCPort(vrc.osc.port) &&
  isValidMIDIChannel(vrc.midi.channel)
