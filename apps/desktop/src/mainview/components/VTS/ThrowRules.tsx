import { CrosshairIcon, ImagesIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { useState } from 'react'

import TestDonationButton from '~/components/TestDonationButton'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Checkbox } from '~/components/ui/checkbox'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '~/components/ui/field'
import { Label } from '~/components/ui/label'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '~/components/ui/tooltip'
import { AlignedField, RangeField } from '~/components/VTS/fields'
import RuleItemsDialog from '~/components/VTS/RuleItemsDialog'
import RuleZonesDialog from '~/components/VTS/RuleZonesDialog'

import {
  createVTSThrowRule,
  isDuplicateVTSRuleAmount,
  isValidVTSRuleItems,
  isValidVTSRuleValue,
  VTS_HIT_ZONES,
  VTS_RULE_RANGES,
  VTSCustomImage,
  VTSThrowRule,
} from '../../../shared/config'

// Puts a new rule above the highest one, so its Min THB isn't a duplicate
const NEW_RULE_STEP = 100

const formatZones = (zones: VTSThrowRule['zones']) =>
  zones.length === VTS_HIT_ZONES.length
    ? 'All'
    : zones.length === 0
      ? 'None'
      : zones.map(zone => zone[0].toUpperCase() + zone.slice(1)).join(', ')

type OpenDialog = { ruleId: string; kind: 'items' | 'zones' }

type ThrowRulesProps = {
  /** Throwing is on, so every rule needs something to throw */
  enabled: boolean
  rules: VTSThrowRule[]
  selectedItems: string[]
  customImages: VTSCustomImage[]
  onChange: (rules: VTSThrowRule[]) => void
  canSendTest: boolean
  onSendTest: () => void
}

const ThrowRules = ({
  enabled,
  rules,
  selectedItems,
  customImages,
  onChange,
  canSendTest,
  onSendTest,
}: ThrowRulesProps) => {
  const [dialog, setDialog] = useState<OpenDialog | null>(null)
  const dialogRule = rules.find(rule => rule.id === dialog?.ruleId)
  const canRemove = rules.length > 1

  const updateRule = (id: string, patch: Partial<VTSThrowRule>) =>
    onChange(rules.map(rule => (rule.id === id ? { ...rule, ...patch } : rule)))

  const addRule = () => {
    const highest = Math.max(
      ...rules.map(rule => rule.minAmount).filter(Number.isFinite)
    )
    const minAmount = Number.isFinite(highest)
      ? Math.min(highest + NEW_RULE_STEP, VTS_RULE_RANGES.minAmount.max)
      : VTS_RULE_RANGES.minAmount.min

    onChange([...rules, createVTSThrowRule({ minAmount })])
  }

  // Turning on a rule with nothing picked yet goes straight to picking
  const setCustom = (rule: VTSThrowRule, custom: boolean) => {
    updateRule(rule.id, { custom })

    if (custom && rule.items.length + rule.images.length === 0) {
      setDialog({ ruleId: rule.id, kind: 'items' })
    }
  }

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
        {rules.map(rule => {
          const customId = `vts-rule-${rule.id}-custom`
          const pickedCount = rule.items.length + rule.images.length
          const zonesId = `vts-rule-${rule.id}-zones`
          const isItemsUnset =
            enabled && !isValidVTSRuleItems(rule, selectedItems, customImages)
          const isZonesUnset = rule.zones.length === 0

          return (
            <li
              key={rule.id}
              className="flex flex-col gap-2 rounded-md border p-3"
            >
              <div className="grid grid-cols-[1fr_1fr_auto_auto_auto] gap-4">
                <RangeField
                  id={`vts-rule-${rule.id}-minAmount`}
                  label="Min THB"
                  value={rule.minAmount}
                  range={VTS_RULE_RANGES.minAmount}
                  step={10}
                  isOutOfRange={
                    !isValidVTSRuleValue('minAmount', rule.minAmount)
                  }
                  error={
                    isDuplicateVTSRuleAmount(rule, rules)
                      ? 'Another rule has this Min THB.'
                      : undefined
                  }
                  onChange={minAmount => updateRule(rule.id, { minAmount })}
                />
                <RangeField
                  id={`vts-rule-${rule.id}-count`}
                  label="Items to throw"
                  value={rule.count}
                  range={VTS_RULE_RANGES.count}
                  step={1}
                  isOutOfRange={!isValidVTSRuleValue('count', rule.count)}
                  onChange={count => updateRule(rule.id, { count })}
                />
                <AlignedField data-invalid={isItemsUnset}>
                  <div className="flex h-8 items-center gap-2">
                    <Checkbox
                      id={customId}
                      checked={rule.custom}
                      onCheckedChange={isChecked =>
                        setCustom(rule, isChecked === true)
                      }
                    />
                    <Label
                      htmlFor={customId}
                      className="cursor-pointer font-normal"
                    >
                      Custom image
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={!rule.custom}
                      onClick={() =>
                        setDialog({ ruleId: rule.id, kind: 'items' })
                      }
                      aria-label={`Choose custom items, ${pickedCount} picked`}
                    >
                      <ImagesIcon />
                      Choose
                      <Badge variant="secondary">{pickedCount}</Badge>
                    </Button>
                  </div>
                </AlignedField>
                <Field data-invalid={isZonesUnset}>
                  <FieldLabel htmlFor={zonesId}>Hit zone</FieldLabel>
                  <div className="flex h-8 items-center">
                    <Button
                      id={zonesId}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setDialog({ ruleId: rule.id, kind: 'zones' })
                      }
                      aria-invalid={isZonesUnset}
                    >
                      <CrosshairIcon />
                      {formatZones(rule.zones)}
                    </Button>
                  </div>
                </Field>
                <AlignedField>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      {/* Disabled buttons get no pointer events, so the
                          wrapper carries the hover and focus for the tooltip */}
                      <span tabIndex={canRemove ? undefined : 0}>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={!canRemove}
                          onClick={() =>
                            onChange(
                              rules.filter(other => other.id !== rule.id)
                            )
                          }
                          aria-label={`Remove the ${rule.minAmount} THB rule`}
                        >
                          <Trash2Icon />
                        </Button>
                      </span>
                    </TooltipTrigger>
                    {!canRemove && (
                      <TooltipContent>
                        You need at least one rule.
                      </TooltipContent>
                    )}
                  </Tooltip>
                </AlignedField>
              </div>
              {isItemsUnset && (
                <FieldError>
                  {rule.custom
                    ? 'Choose at least one custom item.'
                    : 'Select VTube Studio items or add your images above.'}
                </FieldError>
              )}
              {isZonesUnset && (
                <FieldError>Choose at least one hit zone.</FieldError>
              )}
            </li>
          )
        })}
      </ul>
      <FieldDescription>
        A donation uses the rule with the highest Min THB it reaches, and throws
        nothing below every rule. Each item is picked at random from both tabs,
        or with Custom image, from the items you choose, and hits one of the
        rule’s hit zones at random.
      </FieldDescription>
      {dialogRule &&
        (dialog?.kind === 'zones' ? (
          <RuleZonesDialog
            rule={dialogRule}
            onChange={patch => updateRule(dialogRule.id, patch)}
            onClose={() => setDialog(null)}
          />
        ) : (
          <RuleItemsDialog
            rule={dialogRule}
            selectedItems={selectedItems}
            customImages={customImages}
            onChange={patch => updateRule(dialogRule.id, patch)}
            onClose={() => setDialog(null)}
          />
        ))}
    </Field>
  )
}

export default ThrowRules
