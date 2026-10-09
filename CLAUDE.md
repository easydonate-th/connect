# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

See `AGENTS.md` for the full Ultracite code standards and the Turborepo version note (read the installed `turbo` package's `docs/` before changing Turborepo config — version is 2.11.7, which may differ from training data).

## Overview

EasyDonate Connect: a desktop companion app that connects to an EasyDonate alert widget over WebSocket and (planned) forwards donation events to VRChat via OSC/MIDI.

Bun monorepo managed with Turborepo (`bun@1.4.2`, workspaces `apps/*` and `packages/*`):

- `apps/desktop` (`@ezdn/desktop`) — Electrobun desktop app (Bun main process + React 19 webview).
- `apps/unity` — Unity/VRChat project placeholder (currently empty; `.gitignore` has VRChat SDK / UdonSharp entries for it).
- `packages/` — empty.

## Commands

Root (run from repo root):

- `bun install` — install deps (also installs lefthook hooks via `prepare`).
- `bun run dev` — `turbo run dev` across workspaces.
- `bun run build` — `turbo run build`.
- `bun run lint` — `oxlint .`
- `bun run fmt` — `oxfmt .`
- `bunx ultracite fix` / `bunx ultracite check` — format + lint via Ultracite preset.

`apps/desktop`:

- `bun run dev` — `electrobun prepare` + `vite build` + `electrobun dev --watch` (rebuilds bundled view on change).
- `bun run dev:hmr` — runs Vite dev server on port 5173 alongside the app; the main process detects it and loads the webview from `http://localhost:5173` for HMR.
- `bun run build` / `bun run build:canary` — production builds (`--env=stable` / `--env=canary`).

There is no test runner or test suite yet (oxlint config includes the vitest preset in anticipation).

## Desktop app architecture

- **Electrobun, not Electron.** Main process uses the `cottontail` runtime with entrypoint `src/bun/index.ts` (see `electrobun.config.ts`). `electrobun prepare` generates `.hutch/devkit` (gitignored); `vite.config.ts` pulls Electrobun aliases from it and `tsconfig.json` maps `electrobun/*` imports into it via `paths` (it does not extend the devkit tsconfig, whose `baseUrl` TS 7 rejects). Run `prepare` (any dev/build script does) before type-checking or building in a fresh checkout. Type-check with `../../node_modules/.bin/tsc --noEmit -p .` from `apps/desktop`. A project skill at `.claude/skills/electrobun` covers Electrobun APIs.
- **Three source dirs:**
  - `src/bun/` — main process. `index.ts` creates the `BrowserWindow` and menu; `rpc.ts` implements the RPC handlers; `config.ts` caches the config in memory and persists it atomically to `Utils.paths.userData/config.json`; `libs/vrc/` holds the VRChat outputs (`osc.ts` and `midi.ts` are logging stubs to implement, `forward.ts` calls each enabled one).
  - `src/mainview/` — React 19 + Tailwind v4 + shadcn/ui webview. Vite root is `src/mainview`, output goes to `apps/desktop/dist`, which Electrobun copies into `views/mainview/` (loaded as `views://mainview/index.html` in non-HMR mode). Import alias `~/*` maps to `src/mainview/*`.
  - `src/shared/` — imported by both sides with relative paths: zod schemas and types for `Config` (`config.ts`, parsed field by field with defaults) and `Donation` (`donation.ts`, parsed from the socket `DONATE` message), plus the `AppRPC` contract (`rpc.ts`). zod's `.catch` is used through `withFallback` (`fallback.ts`) so the promise lint rule doesn't misfire.
- **Typed RPC bridge:** `src/shared/rpc.ts` defines `AppRPC`: the `bun` side answers `getConfig`/`saveConfig` and receives the fire-and-forget `donation` message. The main process implements it in `src/bun/rpc.ts`; webview wrappers live in `src/mainview/lib/rpc.ts`. To add a capability: extend `AppRPC`, implement the handler in `src/bun/rpc.ts`, add a wrapper in `lib/rpc.ts`.
- **Donation flow:** `hooks/use-widget-socket.ts` connects to `wss://socket.easydonate.app/ezdn<widget query>&ex=easyconnect` (URL built in `lib/widget.ts`) with `react-use-websocket` (infinite reconnect with backoff, ping/PONG heartbeat) and parses each frame with `parseDonationMessage`. Some frames (e.g. PONG) arrive JSON-encoded twice; `src/shared/socket-frame.ts` unwraps them. `App.tsx` sends each `Donation` to the main process, which forwards it to the enabled OSC/MIDI outputs using the cached config. The socket connects only when the user clicks Connect.
- **Logs:** `src/bun/logger.ts` writes to the console and pushes each entry to the webview over the `log` RPC message; the webview adds its own entries through `log` in `src/mainview/lib/logs.ts` (an in-memory store, read with `hooks/use-logs.ts`, that also records incoming socket frames (minus PONG heartbeats and TTS fields, see `lib/raw-frame.ts`) in a separate 500-line buffer for the panel's Raw log toggle). The Logs button toggles `components/LogsPanel.tsx`.
- **UI:** shadcn/ui (`components.json`, Radix base, Nova preset). Add components with `bunx shadcn@latest add <name>` from `apps/desktop`. Generated files in `components/ui/` are excluded from oxlint. `hooks/use-config.ts` suspends on the initial config load (`use()` plus `Suspense` in `main.tsx`) and holds the editable draft. Light theme only.

## Code style

Enforced by oxlint/oxfmt (Ultracite presets core, react, tanstack, vitest, anti-slop) with project overrides:

- Single quotes, no semicolons, 80-col, 2-space indent, `arrowParens: 'avoid'`, sorted imports (groups separated by blank lines), sorted Tailwind classes.
- React components must be arrow functions (`react/function-component-definition`).
- Nested ternaries, `await` in loops, and warning comments are allowed.
