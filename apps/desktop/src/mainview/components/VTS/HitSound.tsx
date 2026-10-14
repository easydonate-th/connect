import { FileMusicIcon, PlayIcon, SquareIcon, Trash2Icon } from 'lucide-react'
import { ChangeEvent, useEffect, useRef, useState } from 'react'
import {
  useController,
  useFormContext,
  useFormState,
  useWatch,
} from 'react-hook-form'

import NumberField from '~/components/NumberField'
import { Button } from '~/components/ui/button'
import { Field, FieldLabel } from '~/components/ui/field'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { Spinner } from '~/components/ui/spinner'
import { AlignedField } from '~/components/VTS/fields'
import { useVTSSoundImport } from '~/hooks/use-vts-sound-import'
import { previewHitSound, stopPreview } from '~/libs/hit-sound'

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
  const [isPreviewing, setIsPreviewing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { isImporting, importSounds } = useVTSSoundImport()

  const { control, getValues, setValue } = useFormContext<Config>()
  const { field: hitSound } = useController({
    control,
    name: 'vts.throw.hitSound',
  })
  const [hitVolume, customSounds] = useWatch({
    control,
    name: ['vts.throw.hitVolume', 'vts.throw.customSounds'],
  })
  const { errors } = useFormState({ control, name: 'vts.throw.hitVolume' })

  const selectedSound = customSounds.find(
    sound => sound.fileName === hitSound.value
  )
  const canPreview =
    hitSound.value !== 'none' && errors.vts?.throw?.hitVolume === undefined

  const handlePreview = () => {
    if (isPreviewing) {
      stopPreview()
    } else if (hitSound.value !== 'none') {
      setIsPreviewing(true)
      previewHitSound({ sound: hitSound.value, volume: hitVolume }, () =>
        setIsPreviewing(false)
      )
    }
  }

  // The webview reads the picked files itself, so a large one never crosses
  // RPC
  const handleAddSounds = () => {
    fileInputRef.current?.click()
  }

  const handleFilesChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = [...(event.currentTarget.files ?? [])]

    // Lets the user pick the same file again
    event.currentTarget.value = ''

    if (files.length === 0) {
      return
    }

    const added = await importSounds(files)

    if (added.length > 0) {
      setValue(
        'vts.throw.customSounds',
        [...getValues('vts.throw.customSounds'), ...added],
        { shouldDirty: true }
      )
      setValue('vts.throw.hitSound', added[0].fileName, { shouldDirty: true })
    }
  }

  const handleRemoveSound = () => {
    setValue('vts.throw.hitSound', 'punch', { shouldDirty: true })
    setValue(
      'vts.throw.customSounds',
      getValues('vts.throw.customSounds').filter(
        sound => sound.fileName !== selectedSound?.fileName
      ),
      { shouldDirty: true }
    )
  }

  // Closing the accordion unmounts this, which would leave a long sound
  // playing with no Stop button
  useEffect(() => stopPreview, [])

  return (
    <div className="grid grid-cols-[1fr_8rem_auto] gap-4">
      <Field>
        <FieldLabel htmlFor="vts-hit-sound">Hit sound</FieldLabel>
        <div className="flex gap-2">
          <Select
            value={hitSound.value}
            onValueChange={sound => hitSound.onChange(sound)}
          >
            <SelectTrigger id="vts-hit-sound" className="min-w-0 flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              {VTS_HIT_SOUNDS.map(sound => (
                <SelectItem key={sound} value={sound}>
                  {SOUND_LABELS[sound]}
                </SelectItem>
              ))}
              {customSounds.length > 0 && (
                <>
                  <SelectSeparator />
                  <SelectGroup>
                    <SelectLabel>Your sounds</SelectLabel>
                    {customSounds.map(sound => (
                      <SelectItem key={sound.fileName} value={sound.fileName}>
                        {sound.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </>
              )}
            </SelectContent>
          </Select>
          {selectedSound && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleRemoveSound}
              aria-label={`Remove ${selectedSound.name}`}
            >
              <Trash2Icon />
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={handleAddSounds}
            disabled={isImporting}
          >
            {isImporting ? <Spinner /> : <FileMusicIcon />}
            Add sounds
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*,video/*"
            multiple
            hidden
            onChange={handleFilesChange}
          />
        </div>
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
          disabled={!isPreviewing && !canPreview}
        >
          {isPreviewing ? <SquareIcon /> : <PlayIcon />}
          {/* The hidden Preview keeps the button's width, so the fields beside
              it don't move */}
          <span className="grid text-left">
            <span className="invisible col-start-1 row-start-1">Preview</span>
            <span className="col-start-1 row-start-1">
              {isPreviewing ? 'Stop' : 'Preview'}
            </span>
          </span>
        </Button>
      </AlignedField>
    </div>
  )
}

export default HitSound
