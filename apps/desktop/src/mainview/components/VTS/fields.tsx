import type { ComponentProps } from 'react'

import { Field, FieldLabel } from '~/components/ui/field'

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
