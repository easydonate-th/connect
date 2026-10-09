import { useSyncExternalStore } from 'react'

import { getLogs, subscribeLogs } from '~/lib/logs'

export const useLogs = () => useSyncExternalStore(subscribeLogs, getLogs)
