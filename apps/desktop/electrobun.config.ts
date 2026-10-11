import type { ElectrobunConfig } from 'electrobun'

export default {
  app: {
    name: 'EasyDonate Connect',
    identifier: 'app.easydonate.connect',
    version: '1.3.3',
  },
  build: {
    mainProcess: 'bun',
    bun: {
      // @ts-expect-error - internal versioning
      version: '1.4.3',
      entrypoint: 'src/bun/index.ts',
      minify: true,
    },
    copy: {
      './dist/index.html': 'views/mainview/index.html',
      './dist/assets': 'views/mainview/assets',
    },
    watchIgnore: ['dist/**'],
    mac: { bundleCEF: false, icons: 'icons/icon.iconset' },
    linux: { bundleCEF: false, icon: 'icons/icon.ico' },
    win: { bundleCEF: false, icon: 'icons/icon.ico' },
  },
} satisfies ElectrobunConfig
