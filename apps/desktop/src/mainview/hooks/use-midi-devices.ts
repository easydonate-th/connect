import { useEffect, useState } from 'react'

import { log } from '~/libs/logs'
import { getMIDIDevices } from '~/libs/rpc'

/** Lists the MIDI output ports, or none after logging a failure. */
const loadDevices = async () => {
  try {
    return await getMIDIDevices()
  } catch (error) {
    log.error(
      `Failed to list MIDI devices: ${error instanceof Error ? error.message : 'unknown error'}`
    )
    return []
  }
}

/** MIDI output ports on this machine, scanned on mount and on `scan()`. */
export const useMIDIDevices = () => {
  const [devices, setDevices] = useState<string[]>([])
  // Starts true so a saved device isn't flagged missing before the first scan
  const [isScanning, setIsScanning] = useState(true)

  const scan = async () => {
    setIsScanning(true)
    setDevices(await loadDevices())
    setIsScanning(false)
  }

  useEffect(() => {
    const loadInitial = async () => {
      setDevices(await loadDevices())
      setIsScanning(false)
    }

    loadInitial()
  }, [])

  return { devices, isScanning, scan }
}
