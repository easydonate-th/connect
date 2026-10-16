type RangeParams = { min: string; max: string }

// Every message is a function, so `describeMessage` calls it without a type
// check
const errors = {
  openFolderFailed: (folder: string) => `Could not open ${folder}`,
  openUrlFailed: (url: string) => `Could not open ${url}`,
  updateNotDownloaded: () => 'The update was not downloaded',
  updateNotStarted: () => 'The update did not start',
  unknownError: () => 'unknown error',
  vtsConnectFailed: (host: string, port: number) =>
    `Cannot connect to VTube Studio at ${host}:${port}. Turn on “Allow Plugin API access” in VTube Studio`,
  vtsConnectionClosed: () => 'Connection to VTube Studio closed',
  vtsRequestTimedOut: (request: string) => `${request} timed out`,
  vtsTokenRejected: () => 'VTube Studio rejected the plugin token',
  imageNotSupported: () => 'not a PNG, JPG or GIF image',
  imageTooLarge: () => 'larger than 5 MB',
  imageSizeOutOfRange: (
    width: number,
    height: number,
    min: number,
    max: number
  ) => `${width}x${height} px, each side must be ${min}-${max} px`,
  soundNotMP3: (name: string) => `${name} is not an MP3`,
  soundFileNameInvalid: (fileName: string) =>
    `Not a sound file name: ${fileName}`,
  midiReadFailed: (id: number, code: number) =>
    `Reading MIDI device ${id} failed (MMRESULT ${code})`,
  midiOpenFailed: (name: string, code: number) =>
    `Opening "${name}" failed (MMRESULT ${code})`,
  midiSendFailed: (name: string, code: number) =>
    `Sending to "${name}" failed (MMRESULT ${code})`,
} satisfies Record<string, (...params: never[]) => string>

const en = {
  tagline: 'Forward donations to your destination',
  save: 'Save',
  revert: 'Revert',
  close: 'Close',
  loading: 'Loading',
  notifications: 'Notifications',
  unsavedChanges: 'Unsaved changes',
  fixInvalidFields: 'Fix the invalid fields to save',
  alreadyRunning: 'Application is already running',
  menu: {
    app: 'App',
    edit: 'Edit',
    quit: 'Quit',
    undo: 'Undo',
    redo: 'Redo',
    cut: 'Cut',
    copy: 'Copy',
    paste: 'Paste',
    selectAll: 'Select All',
  },
  integrations: {
    title: 'Integrations',
    platformNotSupported: 'Platform not supported',
  },
  form: {
    saveFailed: 'Failed to save settings',
    enterHost: 'Enter a host.',
    range: ({ min, max }: RangeParams) => `${min}-${max}`,
    signedRange: ({ min, max }: RangeParams) => `${min} to ${max}`,
    selectDevice: 'Select a device to send donations.',
    selectItems: 'Select or add at least one item.',
    duplicateMinAmount: 'Another rule has this Min THB.',
    chooseCustomItems: 'Choose at least one custom item.',
    selectRuleItems: 'Select VTube Studio items or add your images above.',
    chooseZones: 'Choose at least one hit zone.',
  },
  errors,
}

const th: typeof en = {
  tagline: 'ส่งต่อโดเนทไปยังปลายทางของคุณ',
  save: 'บันทึก',
  revert: 'ย้อนกลับ',
  close: 'ปิด',
  loading: 'กำลังโหลด',
  notifications: 'การแจ้งเตือน',
  unsavedChanges: 'ยังไม่ได้บันทึก',
  fixInvalidFields: 'แก้ช่องที่ไม่ถูกต้องก่อนบันทึก',
  alreadyRunning: 'แอปเปิดอยู่แล้ว',
  menu: {
    app: 'แอป',
    edit: 'แก้ไข',
    quit: 'ออก',
    undo: 'เลิกทำ',
    redo: 'ทำซ้ำ',
    cut: 'ตัด',
    copy: 'คัดลอก',
    paste: 'วาง',
    selectAll: 'เลือกทั้งหมด',
  },
  integrations: {
    title: 'แอปที่เชื่อมต่อ',
    platformNotSupported: 'ไม่รองรับบนระบบนี้',
  },
  form: {
    saveFailed: 'บันทึกการตั้งค่าไม่สำเร็จ',
    enterHost: 'ใส่โฮสต์',
    range: ({ min, max }) => `${min}-${max}`,
    signedRange: ({ min, max }) => `${min} ถึง ${max}`,
    selectDevice: 'เลือกอุปกรณ์ที่จะส่งโดเนท',
    selectItems: 'เลือกหรือเพิ่มไอเทมอย่างน้อย 1 ชิ้น',
    duplicateMinAmount: 'มีเงื่อนไขอื่นใช้ยอดขั้นต่ำนี้แล้ว',
    chooseCustomItems: 'เลือกไอเทมเองอย่างน้อย 1 ชิ้น',
    selectRuleItems: 'เลือกไอเทมของ VTube Studio หรือเพิ่มรูปของคุณด้านบน',
    chooseZones: 'เลือกจุดที่โดนอย่างน้อย 1 จุด',
  },
  errors: {
    openFolderFailed: (folder: string) => `เปิด ${folder} ไม่ได้`,
    openUrlFailed: (url: string) => `เปิด ${url} ไม่ได้`,
    updateNotDownloaded: () => 'ดาวน์โหลดอัปเดตไม่สำเร็จ',
    updateNotStarted: () => 'เริ่มอัปเดตไม่สำเร็จ',
    unknownError: () => 'ไม่ทราบสาเหตุ',
    vtsConnectFailed: (host: string, port: number) =>
      `เชื่อมต่อ VTube Studio ที่ ${host}:${port} ไม่ได้ เปิด “Allow Plugin API access” ใน VTube Studio ก่อน`,
    vtsConnectionClosed: () => 'การเชื่อมต่อกับ VTube Studio ถูกปิด',
    vtsRequestTimedOut: (request: string) => `${request} หมดเวลา`,
    vtsTokenRejected: () => 'VTube Studio ปฏิเสธโทเคนของปลั๊กอิน',
    imageNotSupported: () => 'ไม่ใช่รูป PNG, JPG หรือ GIF',
    imageTooLarge: () => 'ใหญ่กว่า 5 MB',
    imageSizeOutOfRange: (
      width: number,
      height: number,
      min: number,
      max: number
    ) => `${width}x${height} px แต่ละด้านต้องอยู่ระหว่าง ${min}-${max} px`,
    soundNotMP3: (name: string) => `${name} ไม่ใช่ไฟล์ MP3`,
    soundFileNameInvalid: (fileName: string) => `ไม่ใช่ชื่อไฟล์เสียง: ${fileName}`,
    midiReadFailed: (id: number, code: number) =>
      `อ่านอุปกรณ์ MIDI ${id} ไม่สำเร็จ (MMRESULT ${code})`,
    midiOpenFailed: (name: string, code: number) =>
      `เปิด "${name}" ไม่สำเร็จ (MMRESULT ${code})`,
    midiSendFailed: (name: string, code: number) =>
      `ส่งไปยัง "${name}" ไม่สำเร็จ (MMRESULT ${code})`,
  },
}

export const app = { en, th }
