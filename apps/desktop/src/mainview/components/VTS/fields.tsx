import type { ComponentProps } from 'react'

import { Field, FieldError, FieldLabel } from '~/components/ui/field'
import { Input } from '~/components/ui/input'

type RangeFieldProps = {
  id: string
  label: string
  value: number
  range: { min: number; max: number }
  step: number
  isOutOfRange: boolean
  error?: string
  onChange: (value: number) => void
}

export const RangeField = ({
  id,
  label,
  value,
  range: { min, max },
  step,
  isOutOfRange,
  error,
  onChange,
}: RangeFieldProps) => {
  const isInvalid = isOutOfRange || error !== undefined

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        type="number"
        min={min}
        max={max}
        step={step}
        value={Number.isNaN(value) ? '' : value}
        onChange={event => onChange(event.currentTarget.valueAsNumber)}
        aria-invalid={isInvalid}
      />
      {isOutOfRange ? (
        <FieldError>
          {min}-{max.toLocaleString()}
        </FieldError>
      ) : (
        error && <FieldError>{error}</FieldError>
      )}
    </Field>
  )
}

/** A field whose control lines up with the labeled inputs beside it. */
export const AlignedField = ({
  children,
  ...props
}: ComponentProps<typeof Field>) => (
  <Field {...props}>
    <FieldLabel aria-hidden className="invisible">
      &nbsp;
    </FieldLabel>
    {children}
  </Field>
)
