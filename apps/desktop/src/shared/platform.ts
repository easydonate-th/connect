export type Output = 'osc' | 'midi' | 'vts'

const OUTPUT_PLATFORMS: Partial<Record<Output, readonly string[]>> = {
  midi: ['win32'],
}

export const isOutputSupported = (output: Output, platform: string) =>
  OUTPUT_PLATFORMS[output]?.includes(platform) ?? true
