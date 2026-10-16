import { SaveIcon, Undo2Icon } from 'lucide-react'
import { useEffect, useEffectEvent, useSyncExternalStore } from 'react'
import { toast } from 'sonner'

import { Button } from '~/components/ui/button'
import { Spinner } from '~/components/ui/spinner'
import { useMessages } from '~/hooks/use-messages'

const TOAST_ID = 'unsaved-changes'

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
  onRevert: () => void
}

/**
 * Lets the user save or revert changes without scrolling to the Save button.
 */
export const useUnsavedChangesToast = ({
  isDirty,
  isValid,
  isSaving,
  onSave,
  onRevert,
}: UnsavedChangesToastOptions) => {
  const m = useMessages()
  // The toast keeps the buttons from its last update, so read the latest
  // `onSave`, whose draft may have changed since then
  const handleSave = useEffectEvent(onSave)
  const handleRevert = useEffectEvent(onRevert)
  const isHidden = useSyncExternalStore(subscribeHiders, getIsHidden)

  useEffect(() => {
    if (!isDirty || isHidden) {
      toast.dismiss(TOAST_ID)

      return
    }

    toast.warning(m.app.unsavedChanges, {
      id: TOAST_ID,
      description: isValid ? undefined : m.app.fixInvalidFields,
      duration: Number.POSITIVE_INFINITY,
      dismissible: false,
      // A React element, because sonner's own cancel button does nothing while
      // the toast is not dismissible
      cancel: (
        <Button
          size="sm"
          variant="outline"
          className="ml-auto"
          disabled={isSaving}
          onClick={() => handleRevert()}
        >
          <Undo2Icon />
          {m.app.revert}
        </Button>
      ),
      action: (
        <Button
          size="sm"
          disabled={!isValid || isSaving}
          onClick={() => handleSave()}
        >
          {isSaving ? <Spinner /> : <SaveIcon />}
          {m.app.save}
        </Button>
      ),
    })
  }, [isDirty, isValid, isSaving, isHidden, m])
}
