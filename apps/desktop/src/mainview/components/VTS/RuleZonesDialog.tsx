import { CheckIcon, FootprintsIcon, ShirtIcon, SmileIcon } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { Button } from '~/components/ui/button'
import { Checkbox } from '~/components/ui/checkbox'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'

import { VTS_HIT_ZONES } from '../../../shared/config'
import type { VTSHitZone, VTSThrowRule } from '../../../shared/config'

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
  rule: VTSThrowRule
  onChange: (patch: Partial<VTSThrowRule>) => void
  onClose: () => void
}

const RuleZonesDialog = ({ rule, onChange, onClose }: RuleZonesDialogProps) => {
  // Keeps the zones in top-down order
  const toggleZone = (zone: VTSHitZone, isChecked: boolean) =>
    onChange({
      zones: VTS_HIT_ZONES.filter(other =>
        other === zone ? isChecked : rule.zones.includes(other)
      ),
    })

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Hit zones for {Number.isNaN(rule.minAmount) ? '?' : rule.minAmount}{' '}
            THB
          </DialogTitle>
          <DialogDescription>
            Each item of this rule hits one of these at random.
          </DialogDescription>
        </DialogHeader>
        <ul className="grid grid-cols-3 gap-2">
          {VTS_HIT_ZONES.map(zone => {
            const { label, description, icon: Icon } = ZONE_OPTIONS[zone]

            return (
              <li key={zone}>
                <label className="hover:bg-muted has-data-checked:border-primary has-data-checked:bg-muted relative flex h-full cursor-pointer flex-col items-center gap-1.5 rounded-md border px-2 pt-6 pb-3 text-center transition-colors">
                  <Checkbox
                    checked={rule.zones.includes(zone)}
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
              </li>
            )
          })}
        </ul>
        <DialogFooter className="items-center">
          <p className="text-muted-foreground mr-auto text-sm">
            {rule.zones.length} selected
          </p>
          <DialogClose asChild>
            <Button type="button">
              <CheckIcon />
              Done
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default RuleZonesDialog
