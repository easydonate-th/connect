import { PlusIcon } from 'lucide-react'
import { useState } from 'react'
import { useFieldArray, useFormContext } from 'react-hook-form'

import TestDonationButton from '~/components/TestDonationButton'
import { Button } from '~/components/ui/button'
import { Field, FieldLabel } from '~/components/ui/field'
import RuleItemsDialog from '~/components/VTS/RuleItemsDialog'
import RuleZonesDialog from '~/components/VTS/RuleZonesDialog'
import ThrowRule from '~/components/VTS/ThrowRule'
import type { RuleDialogKind } from '~/components/VTS/ThrowRule'

import {
  Config,
  createVTSThrowRule,
  VTS_RULE_RANGES,
} from '../../../shared/config'

// Puts a new rule above the highest one, so its Min THB isn't a duplicate
const NEW_RULE_STEP = 100

type RuleDialog = { index: number; kind: RuleDialogKind }

type ThrowRulesProps = {
  canSendTest: boolean
  onSendTest: () => void
}

const ThrowRules = ({ canSendTest, onSendTest }: ThrowRulesProps) => {
  // The last dialog opened stays mounted after it closes, so it can animate out
  const [dialog, setDialog] = useState<RuleDialog | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const { control, getValues } = useFormContext<Config>()
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'vts.throw.rules',
    keyName: 'key',
  })

  const canRemove = fields.length > 1

  const addRule = () => {
    const highest = Math.max(
      ...getValues('vts.throw.rules')
        .map(rule => rule.minAmount)
        .filter(Number.isFinite)
    )
    const minAmount = Number.isFinite(highest)
      ? Math.min(highest + NEW_RULE_STEP, VTS_RULE_RANGES.minAmount.max)
      : VTS_RULE_RANGES.minAmount.min

    append(createVTSThrowRule({ minAmount }), { shouldFocus: false })
  }

  const openDialog = (index: number, kind: RuleDialogKind) => {
    setDialog({ index, kind })
    setIsDialogOpen(true)
  }
  const closeDialog = () => setIsDialogOpen(false)

  // A closed dialog's rule may have been removed since
  const isDialogMounted = dialog !== null && dialog.index < fields.length

  return (
    <Field>
      <div className="flex items-center gap-2">
        <FieldLabel id="vts-rules-label" className="mr-auto">
          Logic
        </FieldLabel>
        <TestDonationButton
          canSend={canSendTest}
          onSend={onSendTest}
          size="sm"
        />
        <Button type="button" variant="outline" size="sm" onClick={addRule}>
          <PlusIcon />
          Add rule
        </Button>
      </div>
      <ul aria-labelledby="vts-rules-label" className="flex flex-col gap-2">
        {fields.map((field, index) => (
          <ThrowRule
            key={field.key}
            index={index}
            canRemove={canRemove}
            onRemove={() => remove(index)}
            onOpenDialog={kind => openDialog(index, kind)}
          />
        ))}
      </ul>
      {isDialogMounted && dialog.kind === 'items' && (
        <RuleItemsDialog
          index={dialog.index}
          open={isDialogOpen}
          onClose={closeDialog}
        />
      )}
      {isDialogMounted && dialog.kind === 'zones' && (
        <RuleZonesDialog
          index={dialog.index}
          open={isDialogOpen}
          canSendTest={canSendTest}
          onSendTest={onSendTest}
          onClose={closeDialog}
        />
      )}
    </Field>
  )
}

export default ThrowRules
