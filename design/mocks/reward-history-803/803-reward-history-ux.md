# 803: Why a past round paid what it paid

Decision for [livepeer/explorer#803](https://github.com/livepeer/explorer/issues/803). Grounded in the September 2026 Livepeer 2.0 litepaper draft, the current Explorer account tabs, and the boundary set by [802](https://github.com/livepeer/explorer/issues/802). [804](https://github.com/livepeer/explorer/issues/804) (validator UX) stays out, except that a past payout may show the median `RewardMultiplier` as one historical factor.

Mockups: [`index.html`](./index.html) in this folder (Inter via [`../shared/`](../shared/)). Litepaper draft lives beside the 802 mock: [`../mfs-delegation-802/Livepeer_2.0_Litepaper_September_2026_Draft.pdf`](../mfs-delegation-802/Livepeer_2.0_Litepaper_September_2026_Draft.pdf).

## Where it lives

### Put past payouts on History; keep the live status card on Orchestrating

802 owns the _current_ fee-vs-stake status card (“Room to earn” / “Full” / “Balanced”). That card earns its keep on Orchestrating because the user is deciding _now_. 803 owns _past payouts_: which settled rounds paid what, and a receipt for why a chosen round paid that amount. Those are different jobs and different shapes.

**Do not relocate the 802 card onto History and hang a round list under it.** That reads as “current status, plus some history tacked on,” which is nonsense on a History tab. History leads with the past (a list of settled rounds). Selecting a row opens a **receipt** for that round only: which share capped rewards, delay, honesty factor, cut, your share. Live compare stays one click away on Orchestrating.

| Surface                                                                                                       | Role for 803                                                                                                                                                                                          |
| ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`/accounts/[account]/history`](../../../pages/accounts/[account]/history.tsx) on the **node** (orchestrator) | **Primary.** **Rewards** mode as master-detail: rounds list                                                                                                                                           | receipt (wide), list → drill-in receipt (narrow). Keep today’s chronological tx feed as **Transactions** on the same tab. Deep-link: `?mode=rewards&round=N` (optional `?as=delegatorAddress`). |
| [`/accounts/[account]/orchestrating`](../../../pages/accounts/[account]/orchestrating.tsx)                    | **Keeps the 802 status card.** Entry only for 803: “Rewards are paid about a week after the round” → this node’s History · Rewards (selects a settled round). No past-round table here.               |
| [`/accounts/[account]/delegating`](../../../pages/accounts/[account]/delegating.tsx)                          | **Entry only.** Bonded card keeps current 802 state. One past line (“Round N paid you X LPT · Why?”) opens the **delegate node’s** History · Rewards receipt. Optional `?as=` for the personal share. |
| Own-account History when the viewer is only a delegator                                                       | **Light.** Claim rows deep-link to the node’s round receipt. Derivation always lives on the node.                                                                                                     |
| Home, `/orchestrators`, Delegators tab                                                                        | **Out.** Dashboard / market / roster.                                                                                                                                                                 |

Do not add a top-level “Rewards” product page. Today’s History tab is only a tx chronology (`components/HistoryView/`); that feed lists `RewardEvent` amounts without saying what capped them. 803 reuses the tab for past _rewards_, not for a second live MFS card.

### IA rule (what went wrong in the first pass)

Wrong: History = 802 status card on top + “recent rounds” below.  
Right: History = settled rounds list on top + past-tense receipt for the selected round.  
802 vocabulary (“Room to earn”, “Full”) stays on Orchestrating / Delegating. Receipts say “Round N · capped by stake/fees” and tag the binding step “capped rewards.”

### Why this beats the alternatives

1. **Full causal UI on orchestrating.** Collapses live decide-now with archaeology. Past rounds belong one click away on History.
2. **802 card glued onto History.** User’s critique: status belongs where current rewards are read; History is for what already happened. Rejected.
3. **Full causal UI on delegating.** Retells the node’s pool math on every bonded account. One node story, many readers.
4. **New “Rewards” account tab.** Splits “the past” across two tabs. Prefer a mode inside History.
5. **Replace Transactions entirely.** Bonds / votes / tickets still need a feed. Demote; don’t delete.
6. **Home or orchestrators list.** Wrong job.

### Audience jobs on the same shell

Explorer can keep saying “orchestrator.” Below, “node” means that account.

| Audience          | Job                                                              | What History · Rewards answers                                                                                                    |
| ----------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Current delegator | “What did past rounds pay me, and why was that round that size?” | List of your amounts; receipt: which share capped, multiplier, delay, pro-rata after cut. Forward-looking “room” → Orchestrating. |
| Node operator     | “What did past pools mint, and which share capped each?”         | List of pool amounts; same receipt; last mile is pool + kept cut.                                                                 |

One shell, a reader toggle (Delegated here / Operate this node). Same math; different last mile.

## Causal model

Inflationary LPT for a work round is not “stake × APR.” Under Livepeer 2.0 it is a chain of caps:

```text
1. Work round R
   fee_share  = node USDC fees / network USDC fees
   stake_share = node stake (self + delegated) / network stake

2. Eligible share (plain: “rewards follow the smaller number”)
   eligible_share = min(fee_share, stake_share)

3. Eligible LPT (of that round’s node-emissions pot)
   eligible_lpt = eligible_share × node_emissions_pot_R

4. Honesty factor at claim time (not a 804 product surface)
   multiplier = median RewardMultiplier for this node when claimed  ∈ [0, 1]
   pool_lpt = eligible_lpt × multiplier

5. Delay
   claimable in round R + RewardsDelayPeriod (litepaper: 7 rounds)
   Score used is the median at claim, not at work time.

6. Cut split (existing rewardCut)
   node_keeps     = pool_lpt × rewardCut
   delegator_pot  = pool_lpt × (1 − rewardCut)

7. One delegator
   you_lpt = delegator_pot × (your_bonded / node_total_stake)
```

Fees in USDC are a separate pot. They are never capped by stake. This surface may footnote fee cut; it does not pretend MFS caps cash.

Plain labels in chrome (History / receipt):

- Title → “Round N · capped by stake” / “capped by fees” / “fees and stake in balance”. Past tense. **Not** “Room to earn” / “Full” (those are 802 live states).
- Tag on the binding step → “capped rewards” (same idea as 802’s “caps rewards”, past tense).
- Multiplier → “Honesty score at payout” with the 0–1 factor; no validator product.
- Delay → “Worked in round R · Paid in round R+7”.

No jargon in visible labels: no “MFS”, no “headroom”, no “binding constraint”. Formula and parameter names live in tooltips and this doc.

## Copy and color

- Lead with what the past payout was, then why.
- Brand blue is always fees. Brand green is always stake (LPT / shares). Receipt wash follows whichever side _was_ the `min()` that round. Palette from [livepeer.org/brand](https://livepeer.org/brand).
- Never amber for neutral protocol states. Green here means stake quantity, not “good.”
- Do not reuse 802 status chips on History.
- Tabular numbers. Ellipsis character `…`. No em dashes.
- Do not show dollar APY from an unfinished emissions schedule (see open questions).
- “What would have changed this payout” may point at Orchestrating for _current_ room; it must not impersonate the live status card.

## What 803 does not own

- **802 current-state compare** on `/orchestrators` and the orchestrating MFS block. Link out; do not redesign.
- **804 validator product.** No score column on the list, no “how to raise your score” track, no validator set UX. Showing the historical multiplier that already applied to a paid round is in scope; building the scoring product is not.
- **Emissions schedule / network-wide mint size.** Share math is stable; mint size is still a draft in the litepaper. Mock uses a sample pot; call that out here, not in the product chrome.
- **Product implementation.** This folder is design-bounty only until @ECWireless approval.

## Surfaces in the mock

1. **Primary:** Account History · Rewards as **master-detail**.
   - **Wide (≥860px):** settled rounds list left (~40%), past-tense receipt right (~60%, sticky). Selecting a row updates the receipt in place.
   - **Narrow:** list alone; tap a round drills into the receipt with an “All rounds” back control (standard mobile master-detail). Deep-links with `?round=N` land on the receipt pane.
   - Reader toggle changes row amounts and the receipt’s last mile.
2. **Entry sketches:** Orchestrating keeps the 802 card and only shows the week-later handoff; Delegating “Why?” deep-links into the receipt.
3. **Anti-pattern callout:** Transactions mode as today’s HistoryView job, demoted.
4. **Rejected pattern:** 802 status card parked on History; also rejected stacking list _under_ a full-width receipt on desktop when two columns fit.

## Worked example (illustrative; reconcileable)

Subgraph was not reachable from this environment without `NEXT_PUBLIC_SUBGRAPH_API_KEY`, and Livepeer 2.0 per-round fee/stake shares are not in today’s `Pool` / `RewardEvent` schema yet (`Pool` has `rewardTokens`, `totalStake`, `fees`, cuts; not network shares or multiplier). Numbers below are **illustrative**, chosen so a third party can recompute the mock without talking to us. They reuse the 802 “Room to earn” share pair so the two tickets stay consistent.

| Input                          | Value                     | Notes                                                           |
| ------------------------------ | ------------------------- | --------------------------------------------------------------- |
| Work round `R`                 | 4210                      |                                                                 |
| Paid round                     | 4217                      | `R + 7` (`RewardsDelayPeriod`)                                  |
| Node                           | Titan Node (illustrative) |                                                                 |
| Fee share                      | 11.8%                     | blue                                                            |
| Stake share                    | 2.3%                      | green; **smaller → caps rewards**                               |
| Eligible share                 | 2.3%                      | `min(11.8%, 2.3%)`                                              |
| Node-emissions pot for `R`     | 40,000 LPT                | **illustrative** pot after `NodeEmissionShare`; not a live mint |
| Eligible LPT before multiplier | 920 LPT                   | `0.023 × 40,000`                                                |
| `RewardMultiplier` at claim    | 0.95                      | median at claim time                                            |
| Pool LPT                       | 874 LPT                   | `920 × 0.95`                                                    |
| `rewardCut`                    | 10%                       | node keeps                                                      |
| Node keeps                     | 87.4 LPT                  | `874 × 0.10`                                                    |
| Delegator pot                  | 786.6 LPT                 | `874 × 0.90`                                                    |
| Node total stake that round    | 100,000 LPT               |                                                                 |
| Sample delegator bonded        | 2,000 LPT                 | 2% of node                                                      |
| Sample delegator received      | 15.732 LPT                | `786.6 × 0.02`                                                  |

**Why this round paid that:** Stake capped rewards (2.3% &lt; 11.8%). The pool was 95% of the stake-capped eligible amount because the honesty factor at payout was 0.95. Work from round 4210 could not be claimed until round 4217.

**What would have to change to improve the next one:** More stake until it meets fee share (ceiling can still rise toward 11.8%), and/or a higher honesty factor at claim (closer to 1.0). Raising fees alone would not raise this round’s LPT while stake remains the smaller number.

Secondary list rows in the mock use the same math shape with clearly labeled variants (fee-capped round; multiplier 1.0) so reviewers can see both caps without a second page. Sample numbers stay in this doc; the mock chrome does not stamp “illustrative” on every field.

## Data gaps for Explorer / subgraph

Today’s History queries `rewardEvents { rewardTokens, round, delegate }` and merges them into a tx timeline. 803 needs, **per node per work round**, once 2.0 lands:

- fee total and network fee total → fee share
- stake and network stake → stake share
- `min()`, gap
- node-emissions pot (or enough to derive eligible LPT)
- median `RewardMultiplier` used at claim
- claim/paid round (`R + delay`)
- `rewardCut` / `feeShare` for that round (Pool already has cuts)
- for a delegator view: bonded amount and node total stake that round

802’s 7-round window should be the sum of the same per-round series 803 stores. Do not invent a second schema.

## Open questions (NEEDING HUMAN INPUT)

1. **APY / realized return %.** Ticket asked for delegator APY. 802 already flagged emissions as an unfinished draft. **Recommended default:** show LPT amounts and share math only; do not ship APY or “% return” until emissions are fixed. Flag for @ECWireless.
2. **History default mode.** **Recommended default:** `Rewards` when the account is an orchestrator (or when `?mode=rewards`); `Transactions` when the account has no node history. Confirm with stakeholders who still live in the tx feed.
3. **Claim vs auto-distribute.** Litepaper says rewards become claimable after 7 rounds. Exact wallet UX for claim may change how “Paid in round R+7” is worded. Design assumes claimable-at / paid-at are the same round for copy; adjust if claiming is a separate user action shown in Transactions.
4. **`transferBond` / 21-round move** stays an 802 copy concern, not a column here.

## Acceptance

Design mock + this rationale, posted for approval by @ECWireless. No product UI in `pages/` or `components/` until that gate.
