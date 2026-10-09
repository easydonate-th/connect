import { useSyncExternalStore } from 'react'

import { getLogs, subscribeLogs } from '~/libs/logs'

export const useLogs = () => useSyncExternalStore(subscribeLogs, getLogs)
