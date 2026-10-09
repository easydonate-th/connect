export const OSC_PORT_RANGE = { min: 1, max: 65_535 } as const
export const MIDI_CHANNEL_RANGE = { min: 1, max: 16 } as const

export type OSCConfig = {
  enabled: boolean
  host: string
  port: number
}

export type MIDIConfig = {
  enabled: boolean
  deviceName: string
  channel: number
}

export type Config = {
  widgetUrl: string
  autoConnect: boolean
  vrc: {
    osc: OSCConfig
    midi: MIDIConfig
  }
}

export const createDefaultConfig = (): Config => ({
  widgetUrl: '',
  autoConnect: false,
  vrc: {
    osc: { enabled: false, host: '127.0.0.1', port: 9000 },
    midi: { enabled: false, deviceName: '', channel: 1 },
  },
})

export const normalizeConfig = (input: Partial<Config>): Config => {
  const defaults = createDefaultConfig()
  const config = { ...defaults, ...input }
  const osc = { ...defaults.vrc.osc, ...input.vrc?.osc }
  const midi = { ...defaults.vrc.midi, ...input.vrc?.midi }

  return {
    ...config,
    widgetUrl: config.widgetUrl.trim(),
    vrc: {
      osc: { ...osc, host: osc.host.trim() },
      midi: { ...midi, deviceName: midi.deviceName.trim() },
    },
  }
}

const isIntInRange = (value: number, range: { min: number; max: number }) =>
  Number.isInteger(value) && value >= range.min && value <= range.max

export const isValidOSCHost = (host: string) => host.trim() !== ''

export const isValidOSCPort = (port: number) =>
  isIntInRange(port, OSC_PORT_RANGE)

export const isValidMIDIChannel = (channel: number) =>
  isIntInRange(channel, MIDI_CHANNEL_RANGE)

/** True when the OSC and MIDI fields hold usable values. */
export const isValidConfig = ({ vrc }: Config) =>
  isValidOSCHost(vrc.osc.host) &&
  isValidOSCPort(vrc.osc.port) &&
  isValidMIDIChannel(vrc.midi.channel)
