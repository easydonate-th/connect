import { dlopen, FFIType, ptr } from 'bun:ffi'

/**
 * MIDI output through the Windows multimedia API (winmm.dll), loaded with
 * `bun:ffi` so no native addon is needed. WinMM cannot create ports, so the
 * user provides one with a virtual MIDI driver such as loopMIDI.
 */

/** A 3-byte channel message: status, data1, data2. */
export type MIDIMessage = [number, number, number]

// MIDIOUTCAPSW: wMid, wPid (WORD), vDriverVersion (UINT), szPname (WCHAR[32]),
// wTechnology, wVoices, wNotes, wChannelMask (WORD), dwSupport (DWORD)
const CAPS_SIZE = 84
const NAME_OFFSET = 8
const NAME_BYTES = 64

const loadWinMM = () =>
  dlopen('winmm.dll', {
    midiOutGetNumDevs: { args: [], returns: FFIType.u32 },
    midiOutGetDevCapsW: {
      args: [FFIType.u64, FFIType.ptr, FFIType.u32],
      returns: FFIType.u32,
    },
    midiOutOpen: {
      args: [FFIType.ptr, FFIType.u32, FFIType.u64, FFIType.u64, FFIType.u32],
      returns: FFIType.u32,
    },
    midiOutShortMsg: { args: [FFIType.u64, FFIType.u32], returns: FFIType.u32 },
    midiOutClose: { args: [FFIType.u64], returns: FFIType.u32 },
  }).symbols

// Loaded on first use; winmm.dll only exists on Windows
let winmm: ReturnType<typeof loadWinMM> | undefined
const getWinMM = () => (winmm ??= loadWinMM())

/** Throws unless a WinMM call returned MMSYSERR_NOERROR (0). */
const check = (result: number, action: string) => {
  if (result !== 0) {
    throw new Error(`${action} failed (MMRESULT ${result})`)
  }
}

/** Names of the MIDI output ports, indexed by WinMM device ID. */
export const getMIDIDevices = () => {
  if (process.platform !== 'win32') {
    return []
  }

  const api = getWinMM()
  const names: string[] = []

  for (let id = 0; id < api.midiOutGetNumDevs(); id += 1) {
    const caps = new Uint8Array(CAPS_SIZE)
    check(
      api.midiOutGetDevCapsW(BigInt(id), ptr(caps), CAPS_SIZE),
      `Reading MIDI device ${id}`
    )
    const name = new TextDecoder('utf-16le').decode(
      caps.subarray(NAME_OFFSET, NAME_OFFSET + NAME_BYTES)
    )
    names.push(name.split('\0')[0] ?? '')
  }

  return names
}

/**
 * Opens the MIDI output port named `name`, sends `messages` in chunks of
 * `chunkSize` with `interval` milliseconds between chunks, and closes it.
 */
export const sendMIDI = async (
  name: string,
  messages: MIDIMessage[],
  { chunkSize, interval }: { chunkSize: number; interval: number }
) => {
  const id = getMIDIDevices().indexOf(name)

  if (id === -1) {
    throw new Error(`MIDI device "${name}" not found`)
  }

  const api = getWinMM()
  const handleOut = new BigUint64Array(1)
  // The last three arguments are callback, callback data and CALLBACK_NULL
  check(api.midiOutOpen(ptr(handleOut), id, 0n, 0n, 0), `Opening "${name}"`)
  const handle = handleOut[0] ?? 0n

  try {
    for (let start = 0; start < messages.length; start += chunkSize) {
      if (start > 0) {
        await Bun.sleep(interval)
      }

      for (const [status, data1, data2] of messages.slice(
        start,
        start + chunkSize
      )) {
        // Packed little-endian: status, data1, data2
        const packed = status + data1 * 0x1_00 + data2 * 0x1_00_00
        check(api.midiOutShortMsg(handle, packed), `Sending to "${name}"`)
      }
    }
  } finally {
    api.midiOutClose(handle)
  }
}
