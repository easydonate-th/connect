import { PlusIcon } from 'lucide-react'
import { useState } from 'react'
import { useFieldArray, useFormContext } from 'react-hook-form'

import TestDonationButton from '~/components/TestDonationButton'
import { Button } from '~/components/ui/button'
import { Field, FieldDescription, FieldLabel } from '~/components/ui/field'
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

type OpenDialog = { index: number; kind: RuleDialogKind }

type ThrowRulesProps = {
  canSendTest: boolean
  onSendTest: () => void
}

const ThrowRules = ({ canSendTest, onSendTest }: ThrowRulesProps) => {
  const [dialog, setDialog] = useState<OpenDialog | null>(null)

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

  const closeDialog = () => setDialog(null)

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
            onOpenDialog={kind => setDialog({ index, kind })}
          />
        ))}
      </ul>
      <FieldDescription>
        A donation uses the rule with the highest Min THB it reaches, and throws
        nothing below every rule. The rule picks each item at random from both
        tabs, or with Custom image, from the items you choose. Each item hits
        one of the rule’s hit zones at random.
      </FieldDescription>
      {dialog?.kind === 'items' && (
        <RuleItemsDialog index={dialog.index} onClose={closeDialog} />
      )}
      {dialog?.kind === 'zones' && (
        <RuleZonesDialog index={dialog.index} onClose={closeDialog} />
      )}
    </Field>
  )
}

export default ThrowRules
