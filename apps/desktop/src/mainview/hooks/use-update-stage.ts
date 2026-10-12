import { useSyncExternalStore } from 'react'

import { getUpdateStage, subscribeUpdateStage } from '~/libs/update-stage'

export const useUpdateStage = () =>
  useSyncExternalStore(subscribeUpdateStage, getUpdateStage)
