const en = {
  osc: {
    description: 'Send donations to VRChat’s OSC input over UDP.',
    host: 'Host',
    hostDescription: 'VRChat runs on this machine by default.',
    port: 'Port',
  },
  midi: {
    description: 'Send donations to VRChat through a MIDI device.',
    device: 'Device',
    noDevices: 'No MIDI devices found',
    selectDevice: 'Select a device',
    deviceNotFound: (name: string) => `${name} (not found)`,
    rescan: 'Rescan MIDI devices',
    deviceMissing: 'Device not found. Is loopMIDI running?',
    deviceDescription: 'loopMIDI port that VRChat reads from.',
    channel: 'Channel',
  },
}

const th: typeof en = {
  osc: {
    description: 'ส่งโดเนทเข้า OSC ของ VRChat ผ่าน UDP',
    host: 'โฮสต์',
    hostDescription: 'ปกติ VRChat จะรันอยู่บนเครื่องนี้',
    port: 'พอร์ต',
  },
  midi: {
    description: 'ส่งโดเนทเข้า VRChat ผ่านอุปกรณ์ MIDI',
    device: 'อุปกรณ์',
    noDevices: 'ไม่พบอุปกรณ์ MIDI',
    selectDevice: 'เลือกอุปกรณ์',
    deviceNotFound: (name: string) => `${name} (ไม่พบ)`,
    rescan: 'สแกนอุปกรณ์ MIDI ใหม่',
    deviceMissing: 'ไม่พบอุปกรณ์ เปิด loopMIDI อยู่หรือเปล่า',
    deviceDescription: 'พอร์ต loopMIDI ที่ VRChat ใช้รับข้อมูล',
    channel: 'ช่อง',
  },
}

export const vrc = { en, th }
