import { z } from 'zod'

type JsonReviver = Parameters<typeof JSON.parse>[1]

const JsonStringSchema = z.string()

/**
 * Parses a widget socket frame as JSON. Some frames (e.g. the PONG heartbeat
 * reply) arrive JSON-encoded twice, as a JSON string holding JSON, so a string
 * result is parsed once more. Throws on invalid JSON.
 */
export const parseSocketFrame = (frame: string, reviver?: JsonReviver) => {
  const json = JSON.parse(frame, reviver)
  const nested = JsonStringSchema.safeParse(json)
  if (!nested.success) {
    return json
  }

  try {
    return JSON.parse(nested.data, reviver)
  } catch {
    // A plain JSON string, not encoded JSON
    return json
  }
}
