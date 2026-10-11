import { toast } from 'sonner'

import { log } from './logs'
import { openExternal } from './rpc'

/** Opens a page of the app's GitHub repository in the default browser. */
export const openLink = async (url: string) => {
  try {
    await openExternal(url)
  } catch (error) {
    const description = error instanceof Error ? error.message : undefined
    toast.error('Failed to open link', { description })
    log.error(`Failed to open link: ${description ?? 'unknown error'}`)
  }
}
