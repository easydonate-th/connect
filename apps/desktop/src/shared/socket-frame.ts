type JsonReviver = Parameters<typeof JSON.parse>[1]

/**
 * Parses a widget socket frame as JSON. Some frames (e.g. the PONG heartbeat
 * reply) arrive JSON-encoded twice, as a JSON string holding JSON, so a frame
 * holding a JSON string is parsed once more. Throws on invalid JSON.
 */
export const parseSocketFrame = (frame: string, reviver?: JsonReviver) => {
  const json = JSON.parse(frame, reviver)
  if (!frame.trimStart().startsWith('"')) {
    return json
  }

  try {
    return JSON.parse(json, reviver)
  } catch {
    // A plain JSON string, not encoded JSON
    return json
  }
}
