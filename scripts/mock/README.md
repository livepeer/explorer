# Mock subgraph + screenshot harness (dev only, never imported by the app)

1. `node scripts/mock/server.mjs` starts a deterministic mock subgraph on :4010 (`--seed N`, `--verbose`, `MOCK_NOW=<unix>`). It prints the demo account and orchestrator ids, which are also at `GET /health`.
2. `NEXT_PUBLIC_SUBGRAPH_ENDPOINT=http://localhost:4010/graphql pnpm dev --port 3000` runs the app against it.
3. `node scripts/mock/screenshot.mjs [--base http://localhost:3000] [--only portfolio,network] [--out DIR]` saves full-page PNGs (plus a `*.top.png` first screen for long pages) and a `report.json`.
4. The screenshot script uses the global `playwright` and the Chromium in `$PLAYWRIGHT_BROWSERS_PATH` (/opt/pw-browsers). It fakes api.coingecko.com, blocks every other external host, and seeds the watchlist and theme in localStorage.
5. It prints console errors, failed requests, horizontal overflow and NaN/undefined text for each page.
6. The demo data covers a wallet (0x22b5…0c65) that moved from orchestrator A to B, a watched account (0x6a7b…1421) on C, which missed 4 of the last 30 reward calls and raised its cut 12 days ago, and an orchestrator (0x8b57…ad12) that delegates to itself.
7. `fixtures.mjs` generates the data: pools with 27-decimal CRF/CFF factors, snapshots where shares = stake·1e27/crf, 365 days, events, treasury proposals and polls.
8. The server matches each request by operation name (`query Delegators`, `Pools`, …) from `lib/subgraph/*.ts`. A new operation there needs a resolver in `server.mjs`.
9. `GET /coingecko` returns the same fixed prices the screenshot script injects.
10. Nothing here is committed or shipped. Delete the folder once you no longer need it.
