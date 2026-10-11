export type Output = 'osc' | 'midi' | 'vts'

/**
 * The platforms (`process.platform`) each output runs on. MIDI calls
 * winmm.dll, which only Windows has. OSC and VTube Studio talk to a host over
 * the network, so they run everywhere and aren't listed.
 */
const OUTPUT_PLATFORMS: Partial<Record<Output, readonly string[]>> = {
  midi: ['win32'],
}

export const isOutputSupported = (output: Output, platform: string) =>
  OUTPUT_PLATFORMS[output]?.includes(platform) ?? true
