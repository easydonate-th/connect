const en = {
  title: 'Alert widget',
  description: 'Paste your EasyDonate alert widget URL',
  widgetUrl: 'Widget URL',
  widgetUrlPlaceholder: 'https://widgets.easydonate.app?w=alert…',
  connect: 'Connect',
  disconnect: 'Disconnect',
  invalidUrl: 'Invalid widget URL',
  autoConnect: 'Auto connect',
  noDonations: 'No donations received yet.',
  anonymous: 'Anonymous',
  lastDonation: ({
    name,
    amount,
    time,
  }: {
    name: string
    amount: string
    time: string
  }) => `Last donation: ${name} · ${amount} at ${time}`,
  status: {
    idle: 'Not connected',
    connecting: 'Connecting…',
    connected: 'Connected',
    reconnecting: 'Reconnecting…',
  },
  sendTest: 'Send test donation',
  sendTestDisabled: 'Disconnect the widget to send a test donation',
  testDonorName: 'Test Donor',
  testMessage: 'This is a test donation',
}

const th: typeof en = {
  title: 'วิดเจ็ตแจ้งเตือน',
  description: 'วางลิงก์วิดเจ็ตแจ้งเตือนของ EasyDonate',
  widgetUrl: 'ลิงก์วิดเจ็ต',
  widgetUrlPlaceholder: 'https://widgets.easydonate.app?w=alert…',
  connect: 'เชื่อมต่อ',
  disconnect: 'ตัดการเชื่อมต่อ',
  invalidUrl: 'ลิงก์วิดเจ็ตไม่ถูกต้อง',
  autoConnect: 'เชื่อมต่ออัตโนมัติ',
  noDonations: 'ยังไม่มีโดเนทเข้ามา',
  anonymous: 'ไม่ระบุชื่อ',
  lastDonation: ({ name, amount, time }) =>
    `โดเนทล่าสุด: ${name} · ${amount} เมื่อ ${time}`,
  status: {
    idle: 'ไม่ได้เชื่อมต่อ',
    connecting: 'กำลังเชื่อมต่อ…',
    connected: 'เชื่อมต่อแล้ว',
    reconnecting: 'กำลังเชื่อมต่อใหม่…',
  },
  sendTest: 'ทดสอบโดเนท',
  sendTestDisabled: 'ตัดการเชื่อมต่อวิดเจ็ตก่อนถึงจะทดสอบโดเนทได้',
  testDonorName: 'ผู้ทดสอบ',
  testMessage: 'นี่คือโดเนททดสอบ',
}

export const widget = { en, th }
