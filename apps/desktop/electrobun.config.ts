import type { ElectrobunConfig } from 'electrobun'

export default {
  app: {
    name: 'EasyDonate Connect',
    identifier: 'app.easydonate.connect',
    version: '1.9.0',
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
    mac: {
      bundleCEF: false,
      icons: 'icons/icon.iconset',
      codesign: !!process.env.ELECTROBUN_DEVELOPER_ID,
    },
    linux: { bundleCEF: false, icon: 'icons/icon.iconset/icon_256x256.png' },
    win: { bundleCEF: false, icon: 'icons/icon.iconset/icon_256x256.png' },
  },
  release: {
    baseUrl: 'https://nozomi.easydonate.app/connect',
  },
} satisfies ElectrobunConfig
