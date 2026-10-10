import { cn } from 'cn'
import { PianoIcon, RefreshCwIcon } from 'lucide-react'

import { Button } from '~/components/ui/button'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '~/components/ui/field'
import { Input } from '~/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import OutputCard from '~/components/VRC/OutputCard'
import { useMIDIDevices } from '~/hooks/use-midi-devices'

import {
  isValidMIDIChannel,
  isValidMIDIDevice,
  MIDI_CHANNEL_RANGE,
  MIDIConfig,
} from '../../../shared/config'

type MIDIProps = {
  value: MIDIConfig
  onChange: (patch: Partial<MIDIConfig>) => void
}

const MIDI = ({ value, onChange }: MIDIProps) => {
  const { devices, isScanning, scan } = useMIDIDevices()
  const isChannelInvalid = !isValidMIDIChannel(value.channel)
  const isDeviceFound = devices.includes(value.deviceName)
  const isDeviceMissing =
    value.deviceName !== '' && !isDeviceFound && !isScanning
  const isDeviceUnset = !isValidMIDIDevice(value)
  // Keep a saved device in the list while its port is missing. Radix Select
  // rejects empty item values, so unnamed ports are left out.
  const options = (
    value.deviceName === '' || isDeviceFound
      ? devices
      : [value.deviceName, ...devices]
  ).filter(name => name !== '')

  return (
    <OutputCard
      id="midi"
      icon={PianoIcon}
      title="MIDI"
      description="Send donations to VRChat through a MIDI device."
      enabled={value.enabled}
      onEnabledChange={enabled => onChange({ enabled })}
    >
      <FieldGroup className="grid grid-cols-[1fr_8rem] gap-4">
        <Field data-invalid={isDeviceMissing || isDeviceUnset}>
          <FieldLabel htmlFor="midi-device">Device</FieldLabel>
          <div className="flex gap-2">
            <Select
              value={value.deviceName}
              onValueChange={deviceName => onChange({ deviceName })}
            >
              <SelectTrigger
                id="midi-device"
                className="min-w-0 flex-1"
                aria-invalid={isDeviceMissing || isDeviceUnset}
              >
                <SelectValue
                  placeholder={
                    devices.length === 0
                      ? 'No MIDI devices found'
                      : 'Select a device'
                  }
                />
              </SelectTrigger>
              <SelectContent position="popper">
                {options.map(name => (
                  <SelectItem key={name} value={name}>
                    {devices.includes(name) ? name : `${name} (not found)`}
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
              aria-label="Rescan MIDI devices"
            >
              <RefreshCwIcon className={cn(isScanning && 'animate-spin')} />
            </Button>
          </div>
          {isDeviceMissing ? (
            <FieldError>Device not found. Is loopMIDI running?</FieldError>
          ) : isDeviceUnset ? (
            <FieldError>Select a device to send donations.</FieldError>
          ) : (
            <FieldDescription>
              loopMIDI port that VRChat reads from.
            </FieldDescription>
          )}
        </Field>
        <Field data-invalid={isChannelInvalid}>
          <FieldLabel htmlFor="midi-channel">Channel</FieldLabel>
          <Input
            id="midi-channel"
            type="number"
            min={MIDI_CHANNEL_RANGE.min}
            max={MIDI_CHANNEL_RANGE.max}
            placeholder="1"
            value={Number.isNaN(value.channel) ? '' : value.channel}
            onChange={event =>
              onChange({ channel: event.currentTarget.valueAsNumber })
            }
            aria-invalid={isChannelInvalid}
          />
          {isChannelInvalid && (
            <FieldError>
              {MIDI_CHANNEL_RANGE.min}-{MIDI_CHANNEL_RANGE.max}
            </FieldError>
          )}
        </Field>
      </FieldGroup>
    </OutputCard>
  )
}

export default MIDI
