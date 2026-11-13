# 802: Eng appendix

**Reviewers:** open [`index.html`](./index.html). Surfaces, design decisions, open questions, and accessibility live in that page.

This file is for implementers after approval: formula, subgraph gaps, and schema notes.

Issue: [livepeer/explorer#802](https://github.com/livepeer/explorer/issues/802). Hang-offs: [803](https://github.com/livepeer/explorer/issues/803) (reward history), [804](https://github.com/livepeer/explorer/issues/804) (validator UX).

## Causal model

```text
each round: reward % = min(that round’s fee % of network, that round’s stake % of network)
window reward = sum of those capped round rewards
```

Fees (USDC) stay uncapped. Only inflationary LPT for that work is capped by stake (self + delegated). Take `min()` on each round, then sum those capped rewards. The window total is that sum. Trailing fee share and stake share compare nodes; per-round `min()` sets what that node earns.

## Surfaces (product)

| Surface                       | Role                                  |
| ----------------------------- | ------------------------------------- |
| `/orchestrators`              | Primary market compare                |
| `/orchestrators/[address]`    | Primary explanation + Delegate target |
| `/` and `/accounts/[address]` | Secondary card for bonded users       |
| Home, leaderboard, History    | Out of 802 (History is 803)           |

No separate “MFS” page.

## Data this needs

Per node and network, per settled round, then summed across the 7-round window:

- fee total in USDC
- stake (self + delegated)
- that round’s fee share, stake share, and `min()`
- reward cut, fee cut (already present)

The list also shows trailing fee share and stake share over the window, for comparison only. Per-round series is 803’s schema. 802 displays the sum of per-round caps. Validator score fields belong to 804.

## Status icons (shared with 803)

Canonical SVGs: [`../shared/mfs-status-icons.md`](../shared/mfs-status-icons.md).

- **Stake-limited** (stake binding) = trend-up · past on 803: **Stake capped**
- **Fee-limited** (fee binding) = filled circle · past on 803: **Fees capped**
- **Balanced** = scale

## Acceptance

Design mock in `index.html`, posted for stakeholder approval. No product UI in `pages/` or `components/` until that gate.
