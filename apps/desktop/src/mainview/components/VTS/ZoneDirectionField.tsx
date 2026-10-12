import { useId } from 'react'
import { useController, useFormContext } from 'react-hook-form'

import { Checkbox } from '~/components/ui/checkbox'
import { Field, FieldError, FieldLabel } from '~/components/ui/field'
import { Label } from '~/components/ui/label'

import { Config, VTS_THROW_DIRECTIONS } from '../../../shared/config'
import type { VTSHitZone, VTSThrowDirection } from '../../../shared/config'

const DIRECTION_LABELS: Record<VTSThrowDirection, string> = {
  left: 'Left',
  right: 'Right',
}

type ZoneDirectionFieldProps = {
  index: number
  zone: VTSHitZone
  /** The zone's name, for the field's label */
  label: string
  disabled?: boolean
}

const ZoneDirectionField = ({
  index,
  zone,
  label,
  disabled,
}: ZoneDirectionFieldProps) => {
  const id = useId()

  const { control } = useFormContext<Config>()
  const {
    field: directions,
    fieldState: { error },
  } = useController({
    control,
    name: `vts.throw.rules.${index}.zoneDirections.${zone}`,
  })

  const labelId = `${id}-label`

  // Keeps the directions in left-right order
  const toggleDirection = (direction: VTSThrowDirection, isChecked: boolean) =>
    directions.onChange(
      VTS_THROW_DIRECTIONS.filter(other =>
        other === direction ? isChecked : directions.value.includes(other)
      )
    )

  return (
    <Field data-invalid={error !== undefined} data-disabled={disabled}>
      <FieldLabel id={labelId}>{label} thrown from</FieldLabel>
      <fieldset
        disabled={disabled}
        aria-labelledby={labelId}
        className="flex h-8 items-center gap-4"
      >
        {VTS_THROW_DIRECTIONS.map(direction => (
          <Label
            key={direction}
            className="cursor-pointer font-normal group-data-[disabled=true]/field:cursor-not-allowed"
          >
            <Checkbox
              checked={directions.value.includes(direction)}
              onCheckedChange={isChecked =>
                toggleDirection(direction, isChecked === true)
              }
              disabled={disabled}
              aria-invalid={error !== undefined}
            />
            {/* The checkbox dims itself when disabled */}
            <span className="group-data-[disabled=true]/field:opacity-50">
              {DIRECTION_LABELS[direction]}
            </span>
          </Label>
        ))}
      </fieldset>
      <FieldError>{error?.message}</FieldError>
    </Field>
  )
}

export default ZoneDirectionField
