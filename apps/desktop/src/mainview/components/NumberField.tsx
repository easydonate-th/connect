import { useId } from 'react'
import { useController, useFormContext } from 'react-hook-form'
import type { FieldPathByValue } from 'react-hook-form'

import { Field, FieldError, FieldLabel } from '~/components/ui/field'
import { Input } from '~/components/ui/input'

import type { Config } from '../../shared/config'

type NumberFieldProps = {
  name: FieldPathByValue<Config, number>
  label: string
  range: { min: number; max: number }
  step?: number
  placeholder?: string
}

/** A number input whose empty value is `NaN`, which fails validation. */
const NumberField = ({
  name,
  label,
  range: { min, max },
  step,
  placeholder,
}: NumberFieldProps) => {
  const id = useId()

  const { control } = useFormContext<Config>()
  const {
    field,
    fieldState: { error },
  } = useController({ control, name })

  return (
    <Field data-invalid={error !== undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        {...field}
        id={id}
        type="number"
        min={min}
        max={max}
        step={step}
        autoComplete="off"
        placeholder={placeholder}
        value={Number.isNaN(field.value) ? '' : field.value}
        onChange={event => field.onChange(event.currentTarget.valueAsNumber)}
        aria-invalid={error !== undefined}
      />
      <FieldError>{error?.message}</FieldError>
    </Field>
  )
}

export default NumberField
