import { RadioTowerIcon } from 'lucide-react'
import { useController, useFormContext } from 'react-hook-form'

import NumberField from '~/components/NumberField'
import OutputCard from '~/components/OutputCard'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '~/components/ui/field'
import { Input } from '~/components/ui/input'
import { useMessages } from '~/hooks/use-messages'

import { Config, PORT_RANGE } from '../../../shared/config'

const OSC = () => {
  const m = useMessages()

  const { control } = useFormContext<Config>()

  const {
    field: host,
    fieldState: { error: hostError },
  } = useController({ control, name: 'vrc.osc.host' })

  return (
    <OutputCard
      id="osc"
      name="vrc.osc.enabled"
      icon={RadioTowerIcon}
      title="OSC"
      description={m.vrc.osc.description}
    >
      <FieldGroup className="grid grid-cols-[1fr_8rem] gap-4">
        <Field data-invalid={hostError !== undefined}>
          <FieldLabel htmlFor="osc-host">{m.vrc.osc.host}</FieldLabel>
          <Input
            {...host}
            id="osc-host"
            autoComplete="off"
            spellCheck={false}
            placeholder="127.0.0.1"
            aria-invalid={hostError !== undefined}
          />
          {hostError ? (
            <FieldError>{hostError.message}</FieldError>
          ) : (
            <FieldDescription>{m.vrc.osc.hostDescription}</FieldDescription>
          )}
        </Field>
        <NumberField
          name="vrc.osc.port"
          label={m.vrc.osc.port}
          range={PORT_RANGE}
          placeholder="9000"
        />
      </FieldGroup>
    </OutputCard>
  )
}

export default OSC
