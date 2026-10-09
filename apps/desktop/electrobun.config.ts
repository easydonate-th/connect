import type { ElectrobunConfig } from 'electrobun'

export default {
  app: {
    name: 'EasyDonate Connect',
    identifier: 'app.ezdn.connect',
    version: '0.0.0-exp.1',
  },
  build: {
    mainProcess: 'bun',
    bun: {
      entrypoint: 'src/bun/index.ts',
    },
    copy: {
      './dist/index.html': 'views/mainview/index.html',
      './dist/assets': 'views/mainview/assets',
    },
    watchIgnore: ['dist/**'],
    mac: { bundleCEF: false },
    linux: { bundleCEF: false },
    win: { bundleCEF: false },
  },
} satisfies ElectrobunConfig
