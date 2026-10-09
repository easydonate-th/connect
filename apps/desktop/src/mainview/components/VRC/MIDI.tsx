import { PianoIcon } from 'lucide-react'

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
  isValidMIDIChannel,
  MIDI_CHANNEL_RANGE,
  MIDIConfig,
} from '../../../shared/config'

type MIDIProps = {
  value: MIDIConfig
  onChange: (patch: Partial<MIDIConfig>) => void
}

const MIDI = ({ value, onChange }: MIDIProps) => {
  const isChannelInvalid = !isValidMIDIChannel(value.channel)

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
        <Field>
          <FieldLabel htmlFor="midi-device">Device</FieldLabel>
          <Input
            id="midi-device"
            autoComplete="off"
            spellCheck={false}
            placeholder="loopMIDI Port"
            value={value.deviceName}
            onChange={event =>
              onChange({ deviceName: event.currentTarget.value })
            }
          />
          <FieldDescription>
            Virtual MIDI port that VRChat reads from.
          </FieldDescription>
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
