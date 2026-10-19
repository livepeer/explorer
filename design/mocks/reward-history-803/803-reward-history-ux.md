# 803: Eng appendix (not the review surface)

**Reviewers:** open [`index.html`](./index.html). Placement, design decisions, open questions, and accessibility live in that page. Do not review this markdown as the rationale.

This file is for implementers after approval: causal formula, subgraph gaps, and the reconciliable sample numbers.

Issue: [livepeer/explorer#803](https://github.com/livepeer/explorer/issues/803). Boundary: [802](https://github.com/livepeer/explorer/issues/802). [804](https://github.com/livepeer/explorer/issues/804) stays out except historical honesty factor on a paid round.

## Causal model

```text
1. Work round R
   fee_share  = node USDC fees / network USDC fees
   stake_share = node stake (self + delegated) / network stake

2. eligible_share = min(fee_share, stake_share)

3. eligible_lpt = eligible_share × node_emissions_pot_R

4. multiplier = median RewardMultiplier at claim ∈ [0, 1]
   pool_lpt = eligible_lpt × multiplier

5. claimable in round R + RewardsDelayPeriod (7)

6. node_keeps = pool_lpt × rewardCut
   delegator_pot = pool_lpt × (1 − rewardCut)

7. you_lpt = delegator_pot × (your_bonded / node_total_stake)
```

USDC fees are a separate pot; never capped by stake.

## Worked example (illustrative)

| Input                      | Value                       |
| -------------------------- | --------------------------- |
| Work round R               | 4210                        |
| Claimable                  | 4217 (R+7)                  |
| Fee share                  | 11.8%                       |
| Stake share                | 2.3% (caps)                 |
| Node-emissions pot         | 40,000 LPT (illustrative)   |
| Eligible before multiplier | 920 LPT                     |
| Honesty at claim           | 0.95                        |
| Pool LPT                   | 874 LPT                     |
| rewardCut                  | 10%                         |
| Node keeps / delegator pot | 87.4 / 786.6 LPT            |
| Sample bonded / received   | 2,000 LPT (2%) → 15.732 LPT |

## Data gaps for Explorer / subgraph

Per node per work round, once 2.0 lands:

- fee total and network fee total → fee share
- stake and network stake → stake share
- `min()`, gap
- node-emissions pot (or enough to derive eligible LPT)
- median `RewardMultiplier` used at claim
- claim/paid round (`R + delay`)
- `rewardCut` / `feeShare` for that round
- for a delegator view: bonded amount and node total stake that round

802’s 7-round window should be the sum of the same per-round series 803 stores.

## Acceptance

Design mock in `index.html`, posted for approval by @ECWireless. No product UI in `pages/` or `components/` until that gate.
