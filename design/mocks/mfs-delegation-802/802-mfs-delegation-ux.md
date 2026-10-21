# 802: Eng appendix (not the review surface)

**Reviewers:** open [`index.html`](./index.html). Surfaces, design decisions, open questions, and accessibility live in that page. Do not review this markdown as the rationale.

This file is for implementers after approval: formula, subgraph gaps, and schema notes.

Issue: [livepeer/explorer#802](https://github.com/livepeer/explorer/issues/802). Hang-offs: [803](https://github.com/livepeer/explorer/issues/803) (reward history), [804](https://github.com/livepeer/explorer/issues/804) (validator UX).

## Causal model

```text
each round: reward % = min(that round’s fee % of network, that round’s stake % of network)
window reward = sum of those capped round rewards
```

Fees (USDC) are never capped. Only inflationary LPT attached to that work is capped by stake (self + delegated). Take `min()` on each round, then add the capped rewards. Do not `min()` the seven-round totals. Trailing fee share and stake share compare nodes. They are not what the node can earn each round.

## Surfaces (product)

| Surface                             | Role                                  |
| ----------------------------------- | ------------------------------------- |
| `/orchestrators`                    | Primary market compare                |
| `/accounts/[account]/orchestrating` | Primary explanation + Delegate target |
| `/accounts/[account]/delegating`    | Secondary card for bonded users       |
| Home, leaderboard, History          | Out of 802 (History is 803)           |

Do not add an “MFS” page.

## Data this needs

Per node and network, per settled round, then summed across the 7-round window:

- fee total in USDC
- stake (self + delegated)
- that round’s fee share, stake share, and `min()`
- reward cut, fee cut (already present)

The list also shows trailing fee share and stake share over the window, for comparison only. Per-round series is 803’s schema. 802 displays the sum of per-round caps. Validator score fields belong to 804.

## Status icons (shared with 803)

Canonical SVGs: [`../shared/mfs-status-icons.md`](../shared/mfs-status-icons.md).

- **Room to earn** (stake binding) = trend-up · past on 803: **Stake capped**
- **Full** (fee binding) = filled circle · past on 803: **Fees capped**
- **Balanced** = scale

## Acceptance

Design mock in `index.html`, posted for approval by @ECWireless. No product UI in `pages/` or `components/` until that gate.
