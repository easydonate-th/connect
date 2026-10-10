# EasyDonate Connect

EasyDonate Connect is a Windows desktop app that connects to your [EasyDonate](https://easydonate.app) alert widget and forwards each donation to the apps you stream with. VRChat is supported today; Warudo and VTube Studio are in progress.

## Documentation

- [VRChat](docs/VRChat/README.md): send donations to VRChat worlds over MIDI with the EasyDonate SDK, or to OSC tools.
- [Warudo](docs/Warudo/README.md) (work in progress)
- [VTube Studio](docs/VTube%20Studio/README.md) (work in progress)

Each page covers installation and usage.

## How it works

```text
EasyDonate alert widget
        │ WebSocket
        ▼
EasyDonate Connect (desktop app)
        │ MIDI through a loopMIDI port
        ▼
VRChat (EasyDonate SDK in the world)
```

EasyDonate Connect listens to the same socket as your alert widget. Each donation goes to every output turned on in its saved settings (MIDI and OSC for VRChat). In VRChat, the EasyDonate SDK receives the donation on the streamer's client, syncs it to every player in the instance and plays the world's effects.

## Project outline

Bun monorepo managed with Turborepo.

```text
.
├── apps/
│   ├── desktop/                        EasyDonate Connect
│   └── unity/                          Unity project for VRChat worlds
│       ├── Packages/app.easydonate.sdk/    EasyDonate SDK (VPM package)
│       ├── Assets/EasyDonateSDK/Examples/  Example prefabs
│       └── vpm/                            VPM listing and its website
├── docs/                               User documentation per integration
├── packages/                           Shared packages (empty for now)
└── .github/workflows/                  Release and VPM listing workflows
```

### `apps/desktop`

The desktop app, built with [Electrobun](https://electrobun.dev) (a Bun main process and a React 19 webview).

- `src/bun/`: main process. Creates the window, stores the config and sends donations to the VRChat outputs (OSC, and MIDI through winmm).
- `src/mainview/`: the UI, built with React, Tailwind CSS v4 and shadcn/ui. It connects to the widget socket and passes each donation to the main process.
- `src/shared/`: types and the RPC contract used by both sides.

### `apps/unity`

- `Packages/app.easydonate.sdk/`: the EasyDonate SDK for VRChat worlds. It receives donations over MIDI, syncs them to every player and runs Donate Triggers or your own UdonSharp listeners. See its [README](apps/unity/Packages/app.easydonate.sdk/README.md).
- `Assets/EasyDonateSDK/Examples/`: example prefabs that use the SDK. See its [README](apps/unity/Assets/EasyDonateSDK/Examples/README.md).
- `vpm/`: the VPM listing source, published to https://easydonate-th.github.io/connect/ so VCC and ALCOM can install the SDK.

### `.github/workflows`

| Workflow | What it does |
| --- | --- |
| `release-desktop.yml` | Builds the Windows app and releases it as `desktop-v<version>`, using `app.version` in `apps/desktop/electrobun.config.ts`. |
| `release-sdk.yml` | Releases the SDK as `sdk-v<version>` with a package zip and a `.unitypackage`, using the version in its `package.json`. |
| `build-listing.yml` | Builds the VPM listing from the SDK releases and deploys it to GitHub Pages. |

## Development

Requires [Bun](https://bun.sh) 1.4.3. The desktop app runs on Windows only.

```sh
bun install      # install dependencies
bun run dev      # run every workspace in dev mode
bun run build    # build every workspace
bun run lint     # oxlint
bun run fmt      # oxfmt
```

Run `bun run dev` from `apps/desktop` to start only the desktop app. It rebuilds the UI on change.
