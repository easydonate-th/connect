import { z } from 'zod'

/**
 * `z.catch(schema, value)`: parses with `schema`, returning `value` instead of
 * failing. Aliased so it doesn't read as a promise `.catch`.
 */
export const { catch: withFallback } = z

/** Falls back to the object's own field defaults when the input is invalid. */
export const withDefaults = <T extends z.ZodObject>(schema: T) =>
  withFallback(schema, () => schema.parse({}))
