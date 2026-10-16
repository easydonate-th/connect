import type { UpdateStage } from '../../shared/rpc'

const INITIAL_STAGE: UpdateStage = { stage: 'starting', percent: null }

let stage = INITIAL_STAGE
const listeners = new Set<() => void>()

const notify = () => {
  for (const listener of listeners) {
    listener()
  }
}

export const setUpdateStage = (next: UpdateStage) => {
  stage = next
  notify()
}

/** Called before each install, so a retry does not open at the last stage */
export const resetUpdateStage = () => setUpdateStage(INITIAL_STAGE)

export const subscribeUpdateStage = (listener: () => void) => {
  listeners.add(listener)

  return () => {
    listeners.delete(listener)
  }
}

export const getUpdateStage = () => stage
