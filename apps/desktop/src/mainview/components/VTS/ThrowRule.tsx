import { CrosshairIcon, ImagesIcon, Trash2Icon } from 'lucide-react'
import { useId } from 'react'
import {
  useController,
  useFormContext,
  useFormState,
  useWatch,
} from 'react-hook-form'

import NumberField from '~/components/NumberField'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Checkbox } from '~/components/ui/checkbox'
import { Field, FieldError, FieldLabel } from '~/components/ui/field'
import { Label } from '~/components/ui/label'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '~/components/ui/tooltip'
import { AlignedField } from '~/components/VTS/fields'

import {
  Config,
  VTS_HIT_ZONES,
  VTS_RULE_RANGES,
  VTSThrowRule,
} from '../../../shared/config'

export type RuleDialogKind = 'items' | 'zones'

const formatZones = (zones: VTSThrowRule['zones']) =>
  zones.length === VTS_HIT_ZONES.length
    ? 'All'
    : zones.length === 0
      ? 'None'
      : zones.map(zone => zone[0].toUpperCase() + zone.slice(1)).join(', ')

type ThrowRuleProps = {
  index: number
  canRemove: boolean
  onRemove: () => void
  onOpenDialog: (kind: RuleDialogKind) => void
}

const ThrowRule = ({
  index,
  canRemove,
  onRemove,
  onOpenDialog,
}: ThrowRuleProps) => {
  const id = useId()

  const { control } = useFormContext<Config>()
  const { field: custom } = useController({
    control,
    name: `vts.throw.rules.${index}.custom`,
  })
  const [minAmount, items, images, zones] = useWatch({
    control,
    name: [
      `vts.throw.rules.${index}.minAmount`,
      `vts.throw.rules.${index}.items`,
      `vts.throw.rules.${index}.images`,
      `vts.throw.rules.${index}.zones`,
    ],
  })
  const { errors } = useFormState({ control, name: `vts.throw.rules.${index}` })

  const customId = `${id}-custom`
  const zonesId = `${id}-zones`
  const pickedCount = items.length + images.length
  const itemsError = errors.vts?.throw?.rules?.[index]?.items
  const zonesError = errors.vts?.throw?.rules?.[index]?.zones
  const zoneOffsetErrors = errors.vts?.throw?.rules?.[index]?.zoneOffsets
  const zoneWidthErrors = errors.vts?.throw?.rules?.[index]?.zoneWidths
  const zoneDirectionErrors = errors.vts?.throw?.rules?.[index]?.zoneDirections
  // The dialog shows these by each field, but once it closes only the row
  // can tell why Save is off
  const zoneOffsetError = VTS_HIT_ZONES.map(
    zone => zoneOffsetErrors?.[zone]
  ).find(error => error !== undefined)
  const zoneWidthError = VTS_HIT_ZONES.map(
    zone => zoneWidthErrors?.[zone]
  ).find(error => error !== undefined)
  const zoneDirectionError = VTS_HIT_ZONES.map(
    zone => zoneDirectionErrors?.[zone]
  ).find(error => error !== undefined)
  const isZonesInvalid =
    zonesError !== undefined ||
    zoneDirectionError !== undefined ||
    zoneOffsetError !== undefined ||
    zoneWidthError !== undefined

  const handleCustomChange = (isChecked: boolean) => {
    custom.onChange(isChecked)

    if (isChecked && pickedCount === 0) {
      onOpenDialog('items')
    }
  }

  return (
    <li className="flex flex-col gap-2 rounded-md border p-4">
      <div className="grid grid-cols-[1fr_1fr_auto_auto_auto] gap-4">
        <NumberField
          name={`vts.throw.rules.${index}.minAmount`}
          label="Min THB"
          range={VTS_RULE_RANGES.minAmount}
          step={10}
        />
        <NumberField
          name={`vts.throw.rules.${index}.count`}
          label="Items to throw"
          range={VTS_RULE_RANGES.count}
          step={1}
        />
        <AlignedField data-invalid={itemsError !== undefined}>
          <div className="flex h-8 items-center gap-2">
            <Checkbox
              id={customId}
              checked={custom.value}
              onCheckedChange={isChecked =>
                handleCustomChange(isChecked === true)
              }
            />
            <Label htmlFor={customId} className="cursor-pointer font-normal">
              Custom image
            </Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!custom.value}
              onClick={() => onOpenDialog('items')}
              aria-label={`Choose custom items, ${pickedCount} picked`}
            >
              <ImagesIcon />
              Choose
              <Badge variant="secondary">{pickedCount}</Badge>
            </Button>
          </div>
        </AlignedField>
        <Field data-invalid={isZonesInvalid}>
          <FieldLabel htmlFor={zonesId}>Hit zone</FieldLabel>
          <div className="flex h-8 items-center">
            <Button
              id={zonesId}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenDialog('zones')}
              aria-invalid={isZonesInvalid}
            >
              <CrosshairIcon />
              {formatZones(zones)}
            </Button>
          </div>
        </Field>
        <AlignedField>
          <Tooltip>
            <TooltipTrigger asChild>
              {/* Disabled buttons get no pointer events, so the wrapper
                  receives the hover and focus events for the tooltip */}
              <span tabIndex={canRemove ? undefined : 0}>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={!canRemove}
                  onClick={onRemove}
                  aria-label={`Remove the ${minAmount} THB rule`}
                >
                  <Trash2Icon />
                </Button>
              </span>
            </TooltipTrigger>
            {!canRemove && (
              <TooltipContent>You need at least one rule.</TooltipContent>
            )}
          </Tooltip>
        </AlignedField>
      </div>
      <FieldError>{itemsError?.message}</FieldError>
      <FieldError>
        {zonesError?.message ??
          (zoneDirectionError &&
            'Choose at least one side for each hit zone.') ??
          (zoneOffsetError &&
            `Hit zone offsets must be ${zoneOffsetError.message} px.`) ??
          (zoneWidthError &&
            `Hit zone widths must be ${zoneWidthError.message} px.`)}
      </FieldError>
    </li>
  )
}

export default ThrowRule
