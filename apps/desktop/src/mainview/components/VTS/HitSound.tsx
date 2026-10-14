import { PlayIcon } from 'lucide-react'
import {
  useController,
  useFormContext,
  useFormState,
  useWatch,
} from 'react-hook-form'

import NumberField from '~/components/NumberField'
import { Button } from '~/components/ui/button'
import { Field, FieldDescription, FieldLabel } from '~/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { AlignedField } from '~/components/VTS/fields'
import { playHitSound } from '~/libs/hit-sound'

import {
  Config,
  VTS_HIT_SOUNDS,
  VTS_THROW_RANGES,
  VTSHitSound,
} from '../../../shared/config'

const SOUND_LABELS: Record<VTSHitSound, string> = {
  none: 'None',
  punch: 'Punch',
  soft: 'Soft',
  wood: 'Wood',
  metal: 'Metal',
  glass: 'Glass',
  bell: 'Bell',
}

const HitSound = () => {
  const { control } = useFormContext<Config>()
  const { field: hitSound } = useController({
    control,
    name: 'vts.throw.hitSound',
  })
  const hitVolume = useWatch({ control, name: 'vts.throw.hitVolume' })
  const { errors } = useFormState({ control, name: 'vts.throw.hitVolume' })

  const canPreview =
    hitSound.value !== 'none' && errors.vts?.throw?.hitVolume === undefined

  const handlePreview = () => {
    if (hitSound.value !== 'none') {
      playHitSound({ sound: hitSound.value, volume: hitVolume })
    }
  }

  return (
    <div className="grid grid-cols-[1fr_8rem_auto] gap-4">
      <Field>
        <FieldLabel htmlFor="vts-hit-sound">Hit sound</FieldLabel>
        <Select
          value={hitSound.value}
          onValueChange={sound => hitSound.onChange(sound)}
        >
          <SelectTrigger id="vts-hit-sound">
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper">
            {VTS_HIT_SOUNDS.map(sound => (
              <SelectItem key={sound} value={sound}>
                {SOUND_LABELS[sound]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldDescription>
          This app plays it as each item hits, so capture desktop audio to put
          it on stream.
        </FieldDescription>
      </Field>
      <NumberField
        name="vts.throw.hitVolume"
        label="Volume (%)"
        range={VTS_THROW_RANGES.hitVolume}
        step={5}
      />
      <AlignedField>
        <Button
          type="button"
          variant="outline"
          onClick={handlePreview}
          disabled={!canPreview}
        >
          <PlayIcon />
          Preview
        </Button>
      </AlignedField>
    </div>
  )
}

export default HitSound
