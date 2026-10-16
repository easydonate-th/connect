import { cn } from 'cn'
import { PianoIcon, RefreshCwIcon } from 'lucide-react'
import { useController, useFormContext } from 'react-hook-form'

import NumberField from '~/components/NumberField'
import OutputCard from '~/components/OutputCard'
import { Button } from '~/components/ui/button'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '~/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { useMessages } from '~/hooks/use-messages'
import { useMIDIDevices } from '~/hooks/use-midi-devices'

import { Config, MIDI_CHANNEL_RANGE } from '../../../shared/config'

type MIDIProps = {
  isSupported: boolean
}

const MIDI = ({ isSupported }: MIDIProps) => {
  const m = useMessages()

  const { devices, isScanning, scan } = useMIDIDevices()

  const { control } = useFormContext<Config>()

  const {
    field: deviceName,
    fieldState: { error: deviceError },
  } = useController({ control, name: 'vrc.midi.deviceName' })

  const isDeviceFound = devices.includes(deviceName.value)

  const isDeviceMissing =
    deviceName.value !== '' && !isDeviceFound && !isScanning

  // Keep a saved device in the list while its port is missing. Radix Select
  // rejects empty item values, so the list leaves out unnamed ports.
  const options = (
    deviceName.value === '' || isDeviceFound
      ? devices
      : [deviceName.value, ...devices]
  ).filter(name => name !== '')

  return (
    <OutputCard
      id="midi"
      name="vrc.midi.enabled"
      icon={PianoIcon}
      title="MIDI"
      description={m.vrc.midi.description}
      isSupported={isSupported}
    >
      <FieldGroup className="grid grid-cols-[1fr_8rem] gap-4">
        <Field data-invalid={isDeviceMissing || deviceError !== undefined}>
          <FieldLabel htmlFor="midi-device">{m.vrc.midi.device}</FieldLabel>
          <div className="flex gap-2">
            <Select
              value={deviceName.value}
              onValueChange={name => deviceName.onChange(name)}
            >
              <SelectTrigger
                id="midi-device"
                className="min-w-0 flex-1"
                aria-invalid={isDeviceMissing || deviceError !== undefined}
              >
                <SelectValue
                  placeholder={
                    devices.length === 0
                      ? m.vrc.midi.noDevices
                      : m.vrc.midi.selectDevice
                  }
                />
              </SelectTrigger>
              <SelectContent position="popper">
                {options.map(name => (
                  <SelectItem key={name} value={name}>
                    {devices.includes(name)
                      ? name
                      : m.vrc.midi.deviceNotFound(name)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={scan}
              disabled={isScanning}
              aria-label={m.vrc.midi.rescan}
            >
              <RefreshCwIcon className={cn(isScanning && 'animate-spin')} />
            </Button>
          </div>
          {isDeviceMissing ? (
            <FieldError>{m.vrc.midi.deviceMissing}</FieldError>
          ) : deviceError ? (
            <FieldError>{deviceError.message}</FieldError>
          ) : (
            <FieldDescription>{m.vrc.midi.deviceDescription}</FieldDescription>
          )}
        </Field>
        <NumberField
          name="vrc.midi.channel"
          label={m.vrc.midi.channel}
          range={MIDI_CHANNEL_RANGE}
          placeholder="1"
        />
      </FieldGroup>
    </OutputCard>
  )
}

export default MIDI
