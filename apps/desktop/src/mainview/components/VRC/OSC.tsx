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

import { Config, PORT_RANGE } from '../../../shared/config'

const OSC = () => {
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
      description="Send donations to VRChat’s OSC input over UDP."
    >
      <FieldGroup className="grid grid-cols-[1fr_8rem] gap-4">
        <Field data-invalid={hostError !== undefined}>
          <FieldLabel htmlFor="osc-host">Host</FieldLabel>
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
            <FieldDescription>
              VRChat runs on this machine by default.
            </FieldDescription>
          )}
        </Field>
        <NumberField
          name="vrc.osc.port"
          label="Port"
          range={PORT_RANGE}
          placeholder="9000"
        />
      </FieldGroup>
    </OutputCard>
  )
}

export default OSC
