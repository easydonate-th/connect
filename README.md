# EasyDonate Connect

## Documentation

### [VRChat](docs/VRChat/README.md)

### [VTube Studio](docs/VTube%20Studio/README.md)

### [Warudo](docs/Warudo/README.md) (work in progress)

## Project outline

Bun monorepo managed with Turborepo.

```text
.
├── apps/
│   ├── desktop/                        EasyDonate Connect
│   └── unity/                          Unity project for VRChat worlds
│       ├── Packages/app.easydonate.sdk/    EasyDonate SDK (VPM package)
│       │   └── Examples/                   Example prefabs
│       └── vpm/                            VPM listing and its website
├── docs/                               User documentation per integration
└── packages/                           Shared packages (empty for now)
```

### `apps/desktop`

The desktop app, built with [Electrobun](https://electrobun.dev) (a Bun main process and a React 19 webview).

- `src/bun/`: main process. Creates the window, stores the config and sends donations to the VRChat outputs (OSC, and MIDI through winmm).
- `src/mainview/`: the UI, built with React, Tailwind CSS v4 and shadcn/ui. It connects to the widget socket and passes each donation to the main process.
- `src/shared/`: types and the RPC contract used by both sides.

### `apps/unity`

- `Packages/app.easydonate.sdk/`: the EasyDonate SDK for VRChat worlds. It receives donations over MIDI, syncs them to every player and runs Donate Triggers or your own UdonSharp listeners. See its [README](apps/unity/Packages/app.easydonate.sdk/README.md).
- `Packages/app.easydonate.sdk/Examples/`: example prefabs that use the SDK, shipped with the package. See its [README](apps/unity/Packages/app.easydonate.sdk/Examples/README.md).
- `vpm/`: the VPM listing source, published to https://easydonate-th.github.io/connect/ so VCC and ALCOM can install the SDK.

## Development

```sh
bun install

bun run dev

bun run build
```

## Credits

The VTube Studio hit sounds come from [Impact Sounds](https://kenney.nl/assets/impact-sounds) by [Kenney](https://kenney.nl). Kenney released them under [CC0](https://creativecommons.org/publicdomain/zero/1.0/). The converted files and Kenney's license are in `apps/desktop/src/mainview/sounds/`.
