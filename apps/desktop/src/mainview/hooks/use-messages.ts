import { useSyncExternalStore } from 'react'

import { getLanguage, getMessages, subscribeLanguage } from '~/libs/i18n'

export const useLanguage = () =>
  useSyncExternalStore(subscribeLanguage, getLanguage)

export const useMessages = () =>
  useSyncExternalStore(subscribeLanguage, getMessages)
