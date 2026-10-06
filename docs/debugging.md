# Debugging

`.vscode/launch.json` is gitignored, so set up your own configs locally.

## General (no wallet)

Follow the [official Next.js debugging guide](https://nextjs.org/docs/app/guides/debugging) —
it has ready-to-paste `launch.json` configs for server-side, client-side, and
full-stack debugging, plus source-map and DevTools tips.

## With a wallet extension

`launch` starts the browser under automation flags and a fresh profile, which
makes wallet extensions (MetaMask, Brave Wallet, …) hang or refuse to unlock.
Instead, start the browser yourself and **attach** the debugger.

Add this to your `.vscode/launch.json`:

```jsonc
{
  "name": "Browser: attach (wallet)",
  "type": "chrome",
  "request": "attach",
  "port": 9222,
  "url": "http://localhost:3000",
  "webRoot": "${workspaceFolder}"
}
```

### 1. Start the browser with remote debugging

Quit the browser first — a profile can only be open in one instance.

```bash
google-chrome \
  --remote-debugging-port=9222 \
  --user-data-dir="$HOME/.chrome-debug-wallet"
```

This uses a dedicated debug profile — install/import your wallet into it once;
it persists across runs.

> Works for any Chromium browser (Brave, Edge, …) — swap the binary (e.g.
> `/opt/brave.com/brave/brave`). To reuse an existing profile that already has
> your wallet, point `--user-data-dir` at the parent of its _Profile Path_
> (from `chrome://version` / `brave://version`) and add
> `--profile-directory="<leaf>"`, e.g. `--profile-directory="Profile 39"`.

### 2. Start the dev server

```bash
npm run dev
```

### 3. Attach

In VS Code → Run and Debug (`Ctrl+Shift+D`) → **"Browser: attach (wallet)"** →
`F5`. Open `http://localhost:3000` in that browser window; breakpoints bind.

### Notes

- The browser must already be running with `--remote-debugging-port=9222` before
  you attach.
- Port 9222 exposes a control channel over the chosen profile. Fine for local
  dev; don't run it on untrusted networks.
- Reuse the same `--user-data-dir` each run so the wallet stays set up.
