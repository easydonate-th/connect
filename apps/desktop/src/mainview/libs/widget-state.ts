import type { Donation } from '../../shared/donation'
import type { WidgetState } from '../../shared/widget'

let state: WidgetState = { status: 'idle', socketUrl: null }
let lastDonation: Donation | null = null
const listeners = new Set<() => void>()

const notify = () => {
  for (const listener of listeners) {
    listener()
  }
}

/** Mirrors the main process's widget socket, which pushes each change */
export const setWidgetState = (next: WidgetState) => {
  state = next
  notify()
}

export const setLastDonation = (donation: Donation) => {
  lastDonation = donation
  notify()
}

export const subscribeWidgetState = (listener: () => void) => {
  listeners.add(listener)

  return () => {
    listeners.delete(listener)
  }
}

export const getWidgetState = () => state
export const getLastDonation = () => lastDonation
