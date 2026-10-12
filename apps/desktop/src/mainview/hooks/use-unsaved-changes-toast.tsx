import { SaveIcon } from 'lucide-react'
import { useEffect, useEffectEvent, useSyncExternalStore } from 'react'
import { toast } from 'sonner'

import { Button } from '~/components/ui/button'
import { Spinner } from '~/components/ui/spinner'

const TOAST_ID = 'unsaved-changes'

// How many components hide the toast
let hiderCount = 0
const listeners = new Set<() => void>()

const setHiderCount = (count: number) => {
  hiderCount = count
  for (const listener of listeners) {
    listener()
  }
}

const subscribeHiders = (listener: () => void) => {
  listeners.add(listener)

  return () => listeners.delete(listener)
}

const getIsHidden = () => hiderCount > 0

/**
 * Hides the unsaved changes toast while `isActive` is true, for an open dialog
 * with its own Save button.
 */
export const useHideUnsavedChangesToast = (isActive: boolean) =>
  useEffect(() => {
    if (!isActive) {
      return
    }

    setHiderCount(hiderCount + 1)

    return () => setHiderCount(hiderCount - 1)
  }, [isActive])

type UnsavedChangesToastOptions = {
  isDirty: boolean
  isValid: boolean
  isSaving: boolean
  onSave: () => void
}

/** Lets the user save changes without scrolling to the Save button. */
export const useUnsavedChangesToast = ({
  isDirty,
  isValid,
  isSaving,
  onSave,
}: UnsavedChangesToastOptions) => {
  // The toast keeps the button from its last update, so read the latest
  // `onSave`, whose draft may have changed since then
  const handleSave = useEffectEvent(onSave)
  const isHidden = useSyncExternalStore(subscribeHiders, getIsHidden)

  useEffect(() => {
    if (!isDirty || isHidden) {
      toast.dismiss(TOAST_ID)
      return
    }

    toast.warning('Unsaved changes', {
      id: TOAST_ID,
      description: isValid ? undefined : 'Fix the invalid fields to save',
      duration: Number.POSITIVE_INFINITY,
      dismissible: false,
      action: (
        <Button
          size="sm"
          className="ml-auto"
          disabled={!isValid || isSaving}
          onClick={() => handleSave()}
        >
          {isSaving ? <Spinner /> : <SaveIcon />}
          Save
        </Button>
      ),
    })
  }, [isDirty, isValid, isSaving, isHidden])
}
