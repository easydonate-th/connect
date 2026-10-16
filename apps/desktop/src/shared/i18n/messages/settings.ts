const en = {
  title: 'Settings',
  language: 'Language',
  languageSaveFailed: 'Failed to save the language',
  version: 'Version',
  unknownVersion: 'Unknown',
  versionBadge: ({ version }: { version: string }) => `${version} available`,
  dataFolder: 'Data folder',
  dataFolderFailed: 'Failed to open data folder',
  updateAndRestart: 'Update and restart',
  checkForUpdates: 'Check for updates',
  checkFailed: 'Failed to check for updates',
  upToDate: 'You’re up to date',
  isLatest: ({ version }: { version: string }) =>
    `Version ${version} is the latest.`,
  updateAvailable: ({ version }: { version: string }) =>
    `Version ${version} is available`,
  currentVersion: ({ version }: { version: string }) =>
    `You have version ${version}.`,
  update: 'Update',
  saveFirst: 'Save your changes first',
  saveFirstDescription: 'Updating restarts the app, which discards them.',
  installing: 'Installing update',
  restarting: ({ version }: { version: string }) =>
    `Restarting into version ${version}`,
  installFailed: 'Failed to install update',
  download: 'Download',
  updateStages: {
    starting: 'Starting download',
    downloadingPatch: 'Downloading patch',
    applyingPatch: 'Applying patch',
    downloadingUpdate: 'Downloading update',
    preparingUpdate: 'Preparing update',
  },
}

const th: typeof en = {
  title: 'ตั้งค่า',
  language: 'ภาษา',
  languageSaveFailed: 'บันทึกภาษาไม่สำเร็จ',
  version: 'เวอร์ชัน',
  unknownVersion: 'ไม่ทราบ',
  versionBadge: ({ version }) => `${version} มาแล้ว`,
  dataFolder: 'โฟลเดอร์ข้อมูล',
  dataFolderFailed: 'เปิดโฟลเดอร์ข้อมูลไม่สำเร็จ',
  updateAndRestart: 'อัปเดตและรีสตาร์ท',
  checkForUpdates: 'ตรวจหาอัปเดต',
  checkFailed: 'ตรวจหาอัปเดตไม่สำเร็จ',
  upToDate: 'ใช้เวอร์ชันล่าสุดอยู่แล้ว',
  isLatest: ({ version }) => `เวอร์ชัน ${version} คือเวอร์ชันล่าสุด`,
  updateAvailable: ({ version }) => `เวอร์ชัน ${version} มาแล้ว`,
  currentVersion: ({ version }) => `ตอนนี้คุณใช้เวอร์ชัน ${version}`,
  update: 'อัปเดต',
  saveFirst: 'บันทึกการเปลี่ยนแปลงก่อน',
  saveFirstDescription: 'การอัปเดตจะรีสตาร์ทแอป และการเปลี่ยนแปลงที่ยังไม่ได้บันทึกจะหายไป',
  installing: 'กำลังติดตั้งอัปเดต',
  restarting: ({ version }) => `กำลังรีสตาร์ทเป็นเวอร์ชัน ${version}`,
  installFailed: 'ติดตั้งอัปเดตไม่สำเร็จ',
  download: 'ดาวน์โหลด',
  updateStages: {
    starting: 'กำลังเริ่มดาวน์โหลด',
    downloadingPatch: 'กำลังดาวน์โหลดแพตช์',
    applyingPatch: 'กำลังติดตั้งแพตช์',
    downloadingUpdate: 'กำลังดาวน์โหลดอัปเดต',
    preparingUpdate: 'กำลังเตรียมอัปเดต',
  },
}

export const settings = { en, th }
