type JsonReviver = Parameters<typeof JSON.parse>[1]

export const parseSocketFrame = (frame: string, reviver?: JsonReviver) => {
  const json = JSON.parse(frame, reviver)

  if (!frame.trimStart().startsWith('"')) {
    return json
  }

  try {
    return JSON.parse(json, reviver)
  } catch {
    return json
  }
}
