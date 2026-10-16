---
name: desktop-component-pattern
description: Layout and form conventions for React components in apps/desktop/src/mainview. Use when writing, editing or reviewing a component there.
---

# Desktop component pattern

Every component in `apps/desktop/src/mainview/components/` (except the generated `components/ui/`) and `App.tsx` is laid out like this:

```tsx
const ComponentA = ({ id }: ComponentAProps) => {
  const titleId = useId()
  const { events } = useLogs()

  const [isOpen, setIsOpen] = useState(false)
  const listRef = useRef<HTMLUListElement>(null)

  const { devices, isScanning, scan } = useMIDIDevices()

  const { control } = useFormContext<Config>()
  const { field: deviceName } = useController({ control, name: 'vrc.midi.deviceName' })

  const isDeviceFound = devices.includes(deviceName.value)

  const handleScan = () => { ... }

  useEffect(() => { ... }, [isDeviceFound])

  return <></>
}

export default ComponentA
```

## Sections

In this order, one blank line between sections. Do not label them with comments.

1. **Hooks**: hooks that don't depend on anything below: `use(promise)`, `useId`, `useMessages`, `useLogs`, `useUpdateStage`.
2. **State**: `useState` and `useRef`.
3. **Data fetching and mutation**: hooks that load or send data over RPC or the socket: `useMIDIDevices`, `useVTSItems`, `useVTSImageImport`, `useVTSSoundImport`, `useVTSConnectionTest`, `useAppUpdate`, `useWidgetConnection`.
4. **Form**: `useConfigForm`, `useFormContext`, `useController`, `useFieldArray`, `useWatch`, `useFormState`, `useConfigSave`.
5. **Derived values, then handlers**: plain `const`s computed from the above, then event handlers.
6. **Effects**: `useEffect`, and hooks that only run side effects, such as `useUnsavedChangesToast` and `useHideUnsavedChangesToast`. They come after the derived values because an effect's dependency array is evaluated during render.
7. **`return`** with the JSX.

Leave out sections a component doesn't need. A component with no hooks or values keeps the concise body `=> (...)`.

If a hook needs state or a handler from the component body (so it can't sit in its section), move them into a custom hook in `hooks/`. For example, `useWidgetConnection` owns the socket URL and the donation handler that `useWidgetSocket` needs. Hooks in `hooks/` don't follow this layout.

## File shape

- Imports, module-level constants and helpers, the `<Name>Props` type, the component, then `export default <Name>` at the bottom.
- Imports use the `~/` alias for `src/mainview` (`~/components/ui/button`, `~/hooks/use-vts-items`, `~/libs/rpc`) and a relative path for `src/shared` (`../../../shared/config`).
- Components are arrow functions (`react/function-component-definition`).
- A helper component that only this file uses (`CategoryLabel` in `Integrations`, `PickerSection` in `RuleItemsDialog`) sits above the main component with its own `<Name>Props` type. A file that holds small shared components, such as `VTS/fields.tsx`, uses named exports instead of a default.
- A component that renders more than once on the page (`NumberField`, `ThrowRule`, `ZoneDirectionField`) makes its ids with `useId()`, suffixed for each control (`` `${id}-custom` ``). A component that renders once uses static ids (`osc-host`, `midi-device`).
- `AlignedField` (`VTS/fields.tsx`) wraps a button or checkbox that sits in a grid row beside labeled inputs, so it lines up with them under an invisible label.
- Write few comments. Before you add one, cover it and read the code: if a reader would write the same sentence back, leave it out. A name that says what a function, hook, prop or constant does needs no doc comment, and neither does a type, a range or a step the code already shows.
  - Keep: a platform or library quirk, an API or protocol rule, where a magic number comes from, why a line that looks wrong is right, and `SAFETY:`, lint-disable and `@ts-expect-error` reasons.
  - Cut: a doc that repeats the name (`/** The UI text in the current language */` on `useMessages`), lists the steps of the body, labels a section, or restates the type.
  - A one-line `/** */` on a prop states only what its name can't (`/** False while the socket is connected or connecting */` on `canSend`).

## Config form

The config is one react-hook-form form (`hooks/use-config-form.ts`), provided with `FormProvider` in `App.tsx`. Components read and write it through the form context, never through `value`/`onChange` props.

- `useConfigForm` runs once, in `App.tsx`, and returns `{ form, save }`; `useUnsavedChangesToast` runs there too. Every other component reaches the form through the context.
- Get `control`, `getValues` and `setValue` from `useFormContext<Config>()`, so field names are type-checked against `Config`.
- **Text inputs**: `useController`, then spread its field: `<Input {...host} id="osc-host" autoComplete="off" spellCheck={false} />`.
- **Radix controls and array values** (Switch, Select, Checkbox lists): `useController`, passing the value through an arrow (`onCheckedChange={isChecked => enabled.onChange(isChecked)}`), since `react/jsx-handler-names` rejects `enabled.onChange`. A Checkbox's `onCheckedChange` gets `boolean | 'indeterminate'`, so pass `isChecked === true`.
- **Ordered subsets** (zones, throw directions): toggle a value by filtering the canonical list, so the stored array keeps its order: `VTS_HIT_ZONES.filter(other => other === zone ? isChecked : zones.value.includes(other))`.
- **Numbers**: `NumberField` (`components/NumberField.tsx`), which turns an empty input into `NaN` and back. Its `range` is one of the constants in `src/shared/config.ts` (`PORT_RANGE`, `VTS_THROW_RANGES.size`, `VTS_RULE_RANGES.minAmount`), never a literal, so the UI and `validateConfig` agree.
- **Disabled fields**: `disabled` goes after the `{...field}` spread, since RHF's own `disabled` would drop the value from the saved config, and `data-disabled={disabled}` goes on `Field`. `validateConfig` skips a disabled zone's fields.
- **Output card switches**: pass the `enabled` field's name to `OutputCard`.
- **Reading values to render**: `useWatch`, not `getValues` or `watch`. Several at once: `const [port, items] = useWatch({ control, name: ['vts.throw.port', 'vts.throw.items'] })`.
- **Writing from a handler**: `setValue(name, value, { shouldDirty: true })`. Without `shouldDirty`, the unsaved changes toast and Save button go stale. Validation reruns on every change by itself, so `shouldValidate` isn't needed.
- **Throw rules**: `useFieldArray` with `keyName: 'key'` (the default `'id'` would shadow `rule.id`). Key rows by `field.key`, read live values with `useWatch` (`fields` is a snapshot), and change one rule's value by its path (`vts.throw.rules.${index}.items`), not by replacing the array, which remounts every row. A row or dialog takes the rule's `index` as a prop and builds every name from it; for several, `const path = \`vts.throw.rules.${index}\` as const`. Add a rule with `append(createVTSThrowRule({ minAmount }), { shouldFocus: false })`.

## Dialogs

A dialog for one rule (`VTS/RuleItemsDialog`, `VTS/RuleZonesDialog`) takes `index`, `open` and `onClose`, and renders `<Dialog open={open} onOpenChange={onClose}>`.

- The parent keeps which dialog (`{ index, kind }`) and whether it is open in separate state, so the last dialog stays mounted after it closes and Radix can play its exit animation. It renders the dialog only while `dialog.index < fields.length`, so a removed rule never shows one.
- **A pick dialog** edits the draft through `useController` as it goes and closes with a `DialogClose` Done button. The unsaved changes toast stays up.
- **A dialog with its own Save button** gets its save function with `const save = useConfigSave(onClose)` (`hooks/use-config-form.ts`), which closes it once the main process has stored the config. Click handler: `isDirty ? save() : onClose()`, since saving an unchanged draft would only log "Settings saved". It calls `useHideUnsavedChangesToast(open)` (`hooks/use-unsaved-changes-toast.tsx`), because the toast would cover its Save button, and sets `onInteractOutside={event => event.preventDefault()}` on `DialogContent`, so a stray click can't drop the user out mid-edit. Its Save button is `disabled={!isValid || isSubmitting}` with `isDirty`, `isValid` and `isSubmitting` from `useFormState({ control })`, and shows `<Spinner />` in place of its icon while submitting.

## Errors

- Never compute whether config is valid inside a component. Add the rule and its message to `validateConfig` in `src/shared/config.ts`, keyed by the field's RHF path (rules by index: `vts.throw.rules.0.minAmount`). The form's resolver turns it into `formState.errors`, and Save is disabled while any error is present.
- Render a field's error as `<FieldError>{error?.message}</FieldError>`. `FieldError` renders nothing when it has no content. Get `error` from `useController`'s `fieldState` or from `useFormState({ control, name })`.
- A field with a `FieldDescription` shows the error in its place: `{hostError ? <FieldError>{hostError.message}</FieldError> : <FieldDescription>…</FieldDescription>}`.
- Mark the field with `data-invalid` on `Field` and `aria-invalid` on the control.
- Errors that don't come from the config, such as a missing MIDI device after a scan or an invalid widget URL on Connect, stay in component state and don't block Save.
- A failed RPC call reports twice: `toast.error(getMessages().<ns>.<x>Failed, { description: describeError(error, getMessages()) })` in the user's language, and ``log.error(`Failed to …: ${describeError(error) ?? 'unknown error'}`)`` in English (`describeError` from `src/shared/i18n/error.ts`).

## Text

- Every string the user can see (JSX text, `placeholder`, `aria-label`, tooltips, toasts, labels for config values) lives in a namespace file in `src/shared/i18n/messages/`, in both `en` and `th`. A component reads it with `const m = useMessages()`. Code outside React, such as a toast in an async helper, calls `getMessages()` from `~/libs/i18n` when it runs, never at module load. Log lines, and the logs panel with its Logs button, stay English literals in code.
- Text with values is a function with named parameters, so a translation can put them in its own order.
- A toast that stays on screen must re-render its text when the language changes. Put `m` in the effect's dependencies, or render the text through a component that calls `useMessages()`.
