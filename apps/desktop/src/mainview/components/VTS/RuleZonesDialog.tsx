import {
  FootprintsIcon,
  RotateCcwIcon,
  SaveIcon,
  ShirtIcon,
  SmileIcon,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useState } from 'react'
import {
  useController,
  useFormContext,
  useFormState,
  useWatch,
} from 'react-hook-form'

import NumberField from '~/components/NumberField'
import TestDonationButton from '~/components/TestDonationButton'
import { Button } from '~/components/ui/button'
import { Checkbox } from '~/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '~/components/ui/popover'
import { Spinner } from '~/components/ui/spinner'
import ZoneDirectionField from '~/components/VTS/ZoneDirectionField'
import { useConfigSave } from '~/hooks/use-config-form'
import { useHideUnsavedChangesToast } from '~/hooks/use-unsaved-changes-toast'

import {
  Config,
  createVTSThrowRule,
  VTS_HIT_ZONES,
  VTS_ZONE_OFFSET_RANGE,
  VTS_ZONE_WIDTH_RANGE,
} from '../../../shared/config'
import type { VTSHitZone } from '../../../shared/config'

const ZONE_OPTIONS: Record<
  VTSHitZone,
  { label: string; description: string; icon: LucideIcon }
> = {
  head: {
    label: 'Head',
    description: 'Top of the model. Knocks the head hardest.',
    icon: SmileIcon,
  },
  body: {
    label: 'Body',
    description: 'Middle of the model.',
    icon: ShirtIcon,
  },
  feet: {
    label: 'Feet',
    description: 'Bottom of the model, or of what’s on screen.',
    icon: FootprintsIcon,
  },
}

type RuleZonesDialogProps = {
  index: number
  open: boolean
  canSendTest: boolean
  onSendTest: () => void
  onClose: () => void
}

const RuleZonesDialog = ({
  index,
  open,
  canSendTest,
  onSendTest,
  onClose,
}: RuleZonesDialogProps) => {
  const [isResetOpen, setIsResetOpen] = useState(false)

  const { control, setValue } = useFormContext<Config>()

  const { field: zones } = useController({
    control,
    name: `vts.throw.rules.${index}.zones`,
  })

  const minAmount = useWatch({
    control,
    name: `vts.throw.rules.${index}.minAmount`,
  })

  const { isDirty, isValid, isSubmitting } = useFormState({ control })
  const save = useConfigSave(onClose)

  // Keeps the zones in top-down order
  const toggleZone = (zone: VTSHitZone, isChecked: boolean) =>
    zones.onChange(
      VTS_HIT_ZONES.filter(other =>
        other === zone ? isChecked : zones.value.includes(other)
      )
    )

  const resetZones = () => {
    const defaults = createVTSThrowRule()
    const path = `vts.throw.rules.${index}` as const

    setValue(`${path}.zones`, defaults.zones, { shouldDirty: true })
    setValue(`${path}.zoneDirections`, defaults.zoneDirections, {
      shouldDirty: true,
    })
    setValue(`${path}.zoneOffsets`, defaults.zoneOffsets, { shouldDirty: true })
    setValue(`${path}.zoneWidths`, defaults.zoneWidths, { shouldDirty: true })
    setIsResetOpen(false)
  }

  // Saving an unchanged draft would only log "Settings saved"
  const handleSave = () => (isDirty ? save() : onClose())

  // The dialog's Save button stands in for the toast, which would cover it
  useHideUnsavedChangesToast(open)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-xl"
        // Only Save, the close button and Escape close it, so a stray click
        // can't drop the user out mid-edit
        onInteractOutside={event => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            Hit zones for {Number.isNaN(minAmount) ? '?' : minAmount}
            &nbsp;THB
          </DialogTitle>
        </DialogHeader>
        <ul className="grid grid-cols-3 gap-2">
          {VTS_HIT_ZONES.map(zone => {
            const { label, description, icon: Icon } = ZONE_OPTIONS[zone]
            const isDisabled = !zones.value.includes(zone)

            return (
              <li key={zone} className="flex flex-col gap-2">
                <label className="hover:bg-muted has-data-checked:border-primary has-data-checked:bg-muted relative flex flex-1 cursor-pointer flex-col items-center gap-1.5 rounded-md border px-2 pt-6 pb-3 text-center transition-colors">
                  <Checkbox
                    checked={zones.value.includes(zone)}
                    onCheckedChange={isChecked =>
                      toggleZone(zone, isChecked === true)
                    }
                    className="bg-background absolute top-1.5 left-1.5"
                  />
                  <Icon className="text-muted-foreground size-8" />
                  <span className="text-sm font-medium">{label}</span>
                  <span className="text-muted-foreground text-xs">
                    {description}
                  </span>
                </label>
                <ZoneDirectionField
                  index={index}
                  zone={zone}
                  label={label}
                  disabled={isDisabled}
                />
                <NumberField
                  name={`vts.throw.rules.${index}.zoneOffsets.${zone}`}
                  label={`${label} offset (px)`}
                  range={VTS_ZONE_OFFSET_RANGE}
                  step={10}
                  disabled={isDisabled}
                />
                <NumberField
                  name={`vts.throw.rules.${index}.zoneWidths.${zone}`}
                  label={`${label} zone (px)`}
                  range={VTS_ZONE_WIDTH_RANGE}
                  step={10}
                  disabled={isDisabled}
                />
              </li>
            )
          })}
        </ul>
        <DialogDescription>
          Offsets: − moves toward the top, + toward the bottom
        </DialogDescription>
        <DialogFooter className="items-center">
          <Popover open={isResetOpen} onOpenChange={setIsResetOpen}>
            <PopoverTrigger asChild>
              <Button type="button" variant="outline" className="mr-auto">
                <RotateCcwIcon />
                Reset
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" side="top">
              <PopoverHeader>
                <PopoverTitle>Reset hit zones?</PopoverTitle>
                <PopoverDescription>
                  Every zone, side, offset and width of this rule goes back to
                  its default. Nothing is saved until you click Save.
                </PopoverDescription>
              </PopoverHeader>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsResetOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={resetZones}
                >
                  Reset
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          <TestDonationButton canSend={canSendTest} onSend={onSendTest} />
          <Button
            type="button"
            disabled={!isValid || isSubmitting}
            onClick={handleSave}
          >
            {isSubmitting ? <Spinner /> : <SaveIcon />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default RuleZonesDialog
