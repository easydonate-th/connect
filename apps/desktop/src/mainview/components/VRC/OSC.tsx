import { RadioTowerIcon } from 'lucide-react'

import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '~/components/ui/field'
import { Input } from '~/components/ui/input'
import OutputCard from '~/components/VRC/OutputCard'

import {
  isValidOSCPort,
  OSC_PORT_RANGE,
  OSCConfig,
} from '../../../shared/config'

type OSCProps = {
  value: OSCConfig
  onChange: (patch: Partial<OSCConfig>) => void
}

const OSC = ({ value, onChange }: OSCProps) => {
  const isHostInvalid = value.host.trim() === ''
  const isPortInvalid = !isValidOSCPort(value.port)

  return (
    <OutputCard
      id="osc"
      icon={RadioTowerIcon}
      title="OSC"
      description="Send donations to VRChat's OSC input over UDP."
      enabled={value.enabled}
      onEnabledChange={enabled => onChange({ enabled })}
    >
      <FieldGroup className="grid grid-cols-[1fr_8rem] gap-4">
        <Field data-invalid={isHostInvalid}>
          <FieldLabel htmlFor="osc-host">Host</FieldLabel>
          <Input
            id="osc-host"
            autoComplete="off"
            spellCheck={false}
            placeholder="127.0.0.1"
            value={value.host}
            onChange={event => onChange({ host: event.currentTarget.value })}
            aria-invalid={isHostInvalid}
          />
          {isHostInvalid ? (
            <FieldError>Host is required.</FieldError>
          ) : (
            <FieldDescription>
              VRChat runs on this machine by default.
            </FieldDescription>
          )}
        </Field>
        <Field data-invalid={isPortInvalid}>
          <FieldLabel htmlFor="osc-port">Port</FieldLabel>
          <Input
            id="osc-port"
            type="number"
            min={OSC_PORT_RANGE.min}
            max={OSC_PORT_RANGE.max}
            placeholder="9000"
            value={Number.isNaN(value.port) ? '' : value.port}
            onChange={event =>
              onChange({ port: event.currentTarget.valueAsNumber })
            }
            aria-invalid={isPortInvalid}
          />
          {isPortInvalid && (
            <FieldError>
              {OSC_PORT_RANGE.min}-{OSC_PORT_RANGE.max}
            </FieldError>
          )}
        </Field>
      </FieldGroup>
    </OutputCard>
  )
}

export default OSC
