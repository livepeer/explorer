# Livepeer Explorer

![Node.js](https://img.shields.io/badge/node-%3E%3D24.0.0-brightgreen)
![pnpm](https://img.shields.io/badge/pnpm-%3E%3D10.33.0-blue)

The Livepeer Explorer is where LPT holders manage their stake. The default
view is a **portfolio**: stake, rewards and fees for every wallet you care
about, reconstructed round by round, with early warnings when an orchestrator
slips. Around it sit the orchestrator directory, network health, governance
and a live activity feed.

## What's in it

| Route                                                | What it's for                                                                                                                          |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                                                  | Portfolio across the addresses you add (stored in the browser); acting for one asks you to connect it. Onboarding when there are none. |
| `/accounts/[address]`                                | The same portfolio view for any single address.                                                                                        |
| `/orchestrators`                                     | Active set ranked by expected yield (rewards plus fees), with reward-call reliability, cuts, fees and a stake-size estimator.          |
| `/orchestrators/[address]`                           | Profile, per-round yield / stake / fee charts, reward-call history, cut history, delegators.                                           |
| `/gateways`, `/gateways/[address]`                   | Gateways with fees paid, deposit and reserve, and payouts by orchestrator.                                                             |
| `/network`                                           | Current round, participation, inflation and fee volume, with 30-day trends.                                                            |
| `/governance`                                        | Treasury proposals and LIP polls, with voting.                                                                                         |
| `/governance/polls/new`, `/governance/proposals/new` | Create a poll for a proposed LIP, or a treasury proposal.                                                                              |
| `/activity`                                          | Protocol events as they happen, filterable and searchable.                                                                             |

Staking actions (delegate, stake more, move, unstake, restake, withdraw stake,
withdraw fees) run in a single dialog flow from wherever they're relevant.

## How the portfolio numbers are computed

The explorer reads the Livepeer subgraph, including the fields added in
`livepeer/subgraph#217`: delegator `shares`, per-event `DelegatorSnapshot`s,
and cumulative reward/fee factors on every pool. With those, history is exact
rather than estimated:

```
stake[r]  = shares[r]   · CRF[r] / 1e27
reward[r] = shares[r-1] · (CRF[r] − CRF[r-1]) / 1e27
fees[r]   = shares[r-1] · (CFF[r] − CFF[r-1]) / 1e27
```

Rewards come from factor growth, never balance differences, so bonding,
unbonding and moving stake are never mistaken for earnings. Self-delegated
orchestrators also get their reward-cut commission reconstructed. See
`lib/portfolio/compute.ts` and its tests.

"Realised APR" is the yield actually paid over the last 30 rounds, compounded
to a year, not a projection from protocol parameters. The orchestrator list
adds fees (the last 90 days at today's fee share, valued at today's ETH/LPT
price, leaving out fees an orchestrator paid itself) and ranks on the yield at
today's reward cut when a cut was raised. See `lib/orchestrators/ranking.ts`.

## Stack

- Next.js 16 (App Router), React 19, TypeScript
- Tailwind CSS v4 with the Livepeer Design System tokens (`app/globals.css`),
  from the Livepeer UI registry (`livepeer.peaceno.de`)
- Base UI primitives in `components/ui`, Lucide icons, Motion
- TanStack Query over plain GraphQL `fetch` (`lib/subgraph`)
- wagmi + viem + RainbowKit for wallets and transactions
- Recharts for charts

## Getting started

```bash
pnpm install
cp .env.example .env   # all values are optional
pnpm dev
```

With no environment set, the app uses the rate-limited Subgraph Studio URL and
public RPCs, which is fine for local development.

### Environment

| Variable                                                                     | Purpose                                                                                              |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUBGRAPH_API_KEY`                                               | Graph gateway key for the published subgraph. Used from the browser, so restrict it to your domains. |
| `NEXT_PUBLIC_SUBGRAPH_DEPLOYMENT`                                            | Pins one subgraph version by deployment id (`Qm…`).                                                  |
| `NEXT_PUBLIC_SUBGRAPH_ENDPOINT`                                              | Full subgraph URL; overrides the two above.                                                          |
| `NEXT_PUBLIC_INFURA_KEY`, `NEXT_PUBLIC_L1_RPC_URL`, `NEXT_PUBLIC_L2_RPC_URL` | RPC endpoints (Arbitrum for staking, mainnet for ENS).                                               |
| `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID`                                      | WalletConnect project.                                                                               |
| `SITE_URL`                                                                   | Absolute URLs for share images.                                                                      |
| `PINATA_JWT`                                                                 | Pins LIP text to IPFS when creating a poll. Server-only.                                             |
| `GITHUB_ACCESS_TOKEN`                                                        | Optional; raises the GitHub rate limit for reading LIPs. Server-only.                                |

## Scripts

| Command                     |                                                                          |
| --------------------------- | ------------------------------------------------------------------------ |
| `pnpm dev`                  | Dev server                                                               |
| `pnpm build` / `pnpm start` | Production build / serve                                                 |
| `pnpm lint`                 | ESLint, zero warnings                                                    |
| `pnpm typecheck`            | `tsc --noEmit`                                                           |
| `pnpm format`               | Prettier                                                                 |
| `pnpm test`                 | Jest (portfolio maths, orchestrator ranking, paging, governance, CSV, …) |

`scripts/mock` contains a local mock of the subgraph and a Playwright
screenshot script for working on the UI offline.

## Design conventions

These follow the Livepeer Design System so Livepeer products feel like one
family:

- **Ink and paper.** Neutral surfaces; Livepeer green is an accent for status,
  liveness, positive deltas and focus — never a button fill.
- **One primary action per panel**; everything else is outline or ghost.
- **Section titles sit above cards**, not inside them.
- **Sans for language, mono for quantity.** Figures in columns use
  `font-mono tabular-nums`; the hero number uses proportional figures.
- **Charts:** fixed series colours (`--series-1…7`), 2px lines, hairline
  grids, no legend for a single series, never a second y-axis.
- **Honest UI:** no invented numbers — unknown values render as "—".

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).
