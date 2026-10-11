import { SaveIcon } from 'lucide-react'
import { useEffect, useEffectEvent } from 'react'
import { toast } from 'sonner'

import { Button } from '~/components/ui/button'
import { Spinner } from '~/components/ui/spinner'

const TOAST_ID = 'unsaved-changes'

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

  useEffect(() => {
    if (!isDirty) {
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
  }, [isDirty, isValid, isSaving])
}
