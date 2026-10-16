import { useEffect, useState } from 'react'

import { log } from '~/libs/logs'
import { getMIDIDevices } from '~/libs/rpc'

import { describeError } from '../../shared/i18n/error'

const loadDevices = async () => {
  try {
    return await getMIDIDevices()
  } catch (error) {
    log.error(
      `Failed to list MIDI devices: ${describeError(error) ?? 'unknown error'}`
    )

    return []
  }
}

export const useMIDIDevices = () => {
  const [devices, setDevices] = useState<string[]>([])
  // Starts true so the UI doesn't flag a saved device as missing before the
  // first scan
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
