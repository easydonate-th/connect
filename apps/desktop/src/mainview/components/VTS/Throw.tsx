import { cn } from 'cn'
import {
  ImagePlusIcon,
  PlugZapIcon,
  RefreshCwIcon,
  TargetIcon,
  XIcon,
} from 'lucide-react'
import {
  useController,
  useFormContext,
  useFormState,
  useWatch,
} from 'react-hook-form'

import NumberField from '~/components/NumberField'
import OutputCard from '~/components/OutputCard'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Checkbox } from '~/components/ui/checkbox'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '~/components/ui/field'
import { Input } from '~/components/ui/input'
import { Spinner } from '~/components/ui/spinner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { AlignedField } from '~/components/VTS/fields'
import HitSound from '~/components/VTS/HitSound'
import ImageThumbnail from '~/components/VTS/ImageThumbnail'
import ThrowRules from '~/components/VTS/ThrowRules'
import { useMessages } from '~/hooks/use-messages'
import { useVTSConnectionTest } from '~/hooks/use-vts-connection-test'
import { useVTSImageImport } from '~/hooks/use-vts-image-import'
import { useVTSItems } from '~/hooks/use-vts-items'

import {
  Config,
  PORT_RANGE,
  VTS_THROW_RANGES,
  VTSThrowRangeKey,
} from '../../../shared/config'

const MOTION_FIELDS: {
  field: Exclude<VTSThrowRangeKey, 'hitVolume'>
  step: number
}[] = [
  { field: 'size', step: 0.01 },
  { field: 'flightTime', step: 0.05 },
  { field: 'spin', step: 15 },
  { field: 'fadeTime', step: 0.1 },
  { field: 'hitForce', step: 0.25 },
]

type ThrowProps = {
  canSendTest: boolean
  onSendTest: () => void
}

const Throw = ({ canSendTest, onSendTest }: ThrowProps) => {
  const m = useMessages()

  const { items: scannedItems, isScanning, scan } = useVTSItems()
  const { isImporting, importImages } = useVTSImageImport()
  const { isTesting, test } = useVTSConnectionTest()

  const { control, getValues, setValue } = useFormContext<Config>()

  const {
    field: host,
    fieldState: { error: hostError },
  } = useController({ control, name: 'vts.throw.host' })

  const [port, items, customImages] = useWatch({
    control,
    name: ['vts.throw.port', 'vts.throw.items', 'vts.throw.customImages'],
  })

  const { errors } = useFormState({
    control,
    name: ['vts.throw.port', 'vts.throw.items'],
  })

  const itemsError = errors.vts?.throw?.items

  const isEndpointInvalid =
    hostError !== undefined || errors.vts?.throw?.port !== undefined

  // Only a scan can tell that a selected item is gone, so until then the list
  // shows only the selected items
  const missingItems =
    scannedItems === null
      ? []
      : items.filter(item => !scannedItems.includes(item))

  const itemOptions =
    scannedItems === null ? items : [...scannedItems, ...missingItems]

  // Rules can only pick what the tabs list
  const removeFromRules = (key: 'items' | 'images', value: string) => {
    for (const [index, rule] of getValues('vts.throw.rules').entries()) {
      setValue(
        `vts.throw.rules.${index}.${key}`,
        rule[key].filter(selected => selected !== value),
        { shouldDirty: true }
      )
    }
  }

  const toggleItem = (item: string, isChecked: boolean) => {
    setValue(
      'vts.throw.items',
      isChecked
        ? [...items, item]
        : items.filter(selected => selected !== item),
      { shouldDirty: true }
    )

    if (!isChecked) {
      removeFromRules('items', item)
    }
  }

  const handleAddImages = async () => {
    const added = await importImages()

    if (added.length > 0) {
      setValue(
        'vts.throw.customImages',
        [...getValues('vts.throw.customImages'), ...added],
        { shouldDirty: true }
      )
    }
  }

  const removeImage = (fileName: string) => {
    setValue(
      'vts.throw.customImages',
      getValues('vts.throw.customImages').filter(
        image => image.fileName !== fileName
      ),
      { shouldDirty: true }
    )
    removeFromRules('images', fileName)
  }

  return (
    <OutputCard
      id="vts-throw"
      name="vts.throw.enabled"
      icon={TargetIcon}
      title={m.vts.throw.title}
      description={m.vts.throw.description}
    >
      <FieldGroup className="gap-6">
        <div className="grid grid-cols-[1fr_8rem_auto] gap-4">
          <Field data-invalid={hostError !== undefined}>
            <FieldLabel htmlFor="vts-host">{m.vts.throw.host}</FieldLabel>
            <Input
              {...host}
              id="vts-host"
              autoComplete="off"
              spellCheck={false}
              placeholder="127.0.0.1"
              aria-invalid={hostError !== undefined}
            />
            {hostError && <FieldError>{hostError.message}</FieldError>}
          </Field>
          <NumberField
            name="vts.throw.port"
            label={m.vts.throw.port}
            range={PORT_RANGE}
            placeholder="8001"
          />
          <AlignedField>
            <Button
              type="button"
              variant="outline"
              onClick={() => test({ host: host.value, port })}
              disabled={isTesting || isEndpointInvalid}
            >
              {isTesting ? <Spinner /> : <PlugZapIcon />}
              {m.vts.throw.testConnection}
            </Button>
          </AlignedField>
        </div>
        <Field
          data-invalid={missingItems.length > 0 || itemsError !== undefined}
        >
          <FieldLabel id="vts-items-label">{m.vts.throw.items}</FieldLabel>
          <Tabs
            defaultValue={
              items.length === 0 && customImages.length > 0 ? 'images' : 'vts'
            }
            aria-labelledby="vts-items-label"
          >
            <TabsList>
              <TabsTrigger value="vts">
                VTube Studio
                <Badge variant="secondary">{items.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="images">
                {m.vts.throw.yourImages}
                <Badge variant="secondary">{customImages.length}</Badge>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="vts" className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <p className="text-muted-foreground mr-auto text-sm">
                  {scannedItems === null
                    ? m.vts.throw.itemsFolderHint
                    : m.vts.throw.selectedCount(
                        items.length,
                        scannedItems.length
                      )}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => scan({ host: host.value, port })}
                  disabled={isScanning || isEndpointInvalid}
                >
                  <RefreshCwIcon className={cn(isScanning && 'animate-spin')} />
                  {m.vts.throw.scan}
                </Button>
              </div>
              <ul className="flex h-56 flex-col overflow-y-auto rounded-md border">
                {itemOptions.map(item => (
                  <li key={item} className="border-b last:border-b-0">
                    <label className="hover:bg-muted flex cursor-pointer items-center gap-2 px-3 py-2.5 text-sm transition-colors">
                      <Checkbox
                        checked={items.includes(item)}
                        onCheckedChange={isChecked =>
                          toggleItem(item, isChecked === true)
                        }
                      />
                      <span className="truncate">{item}</span>
                      {missingItems.includes(item) && (
                        <span className="text-destructive shrink-0">
                          {m.vts.throw.notFound}
                        </span>
                      )}
                    </label>
                  </li>
                ))}
                {itemOptions.length === 0 && (
                  <li className="text-muted-foreground px-3 py-2 text-sm">
                    {scannedItems === null
                      ? m.vts.throw.scanToList
                      : m.vts.throw.itemsFolderEmpty}
                  </li>
                )}
              </ul>
            </TabsContent>
            <TabsContent value="images" className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <p className="text-muted-foreground mr-auto text-sm">
                  {m.vts.throw.imageRequirements}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddImages}
                  disabled={isImporting}
                >
                  <ImagePlusIcon />
                  {m.vts.throw.addImages}
                </Button>
              </div>
              <ul className="flex h-56 flex-col overflow-y-auto rounded-md border">
                {customImages.map(image => (
                  <li
                    key={image.fileName}
                    className="flex items-center gap-2 border-b py-1.5 pr-1.5 pl-3 text-sm last:border-b-0"
                  >
                    <ImageThumbnail image={image} />
                    <span className="truncate">{image.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="ml-auto"
                      onClick={() => removeImage(image.fileName)}
                      aria-label={m.vts.throw.removeImage(image.name)}
                    >
                      <XIcon />
                    </Button>
                  </li>
                ))}
                {customImages.length === 0 && (
                  <li className="text-muted-foreground px-3 py-2 text-sm">
                    {m.vts.throw.noImages}
                  </li>
                )}
              </ul>
            </TabsContent>
          </Tabs>
          {missingItems.length > 0 ? (
            <FieldError>{m.vts.throw.itemsMissing}</FieldError>
          ) : itemsError ? (
            <FieldError>{itemsError.message}</FieldError>
          ) : null}
        </Field>
        <div className="grid grid-cols-5 gap-4">
          {MOTION_FIELDS.map(({ field, step }) => (
            <NumberField
              key={field}
              name={`vts.throw.${field}`}
              label={m.vts.throw.motion[field]}
              range={VTS_THROW_RANGES[field]}
              step={step}
            />
          ))}
        </div>
        <HitSound />
        <ThrowRules canSendTest={canSendTest} onSendTest={onSendTest} />
      </FieldGroup>
    </OutputCard>
  )
}

export default Throw
