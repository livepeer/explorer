# 803: Why a past round paid what it paid

Decision for [livepeer/explorer#803](https://github.com/livepeer/explorer/issues/803). Grounded in Livepeer 2.0 reward math, the current Explorer account tabs, and the boundary set by [802](https://github.com/livepeer/explorer/issues/802). [804](https://github.com/livepeer/explorer/issues/804) (validator UX) stays out, except that a past payout may show the median `RewardMultiplier` as one historical factor.

Mockups: [`index.html`](./index.html) in this folder (Inter via [`../shared/`](../shared/)).

## Where it lives

### Put past payouts on History; keep the live status card on Orchestrating

802 owns the _current_ fee-vs-stake status card (“Room to earn” / “Full” / “Balanced”). That card earns its keep on Orchestrating because the user is deciding _now_. 803 owns _past payouts_: which settled rounds paid what, and a receipt for why a chosen round paid that amount. Those are different jobs and different shapes.

**Do not relocate the 802 card onto History and hang a round list under it.** That reads as “current status, plus some history tacked on,” which is nonsense on a History tab. History leads with the past (a list of settled rounds). Selecting a row opens a **receipt** for that round only: which share capped rewards, delay, honesty factor, cut, your share. Live compare stays one click away on Orchestrating.

| Who              | Surface                                                                                 | Role for 803                                                                                                        |
| ---------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| You run the node | [`/accounts/[node]/history`](../../../pages/accounts/[account]/history.tsx) · Rewards   | **Primary for operators.** Settled node rounds → pool receipt. Transactions on the same tab.                        |
| You delegated    | [`/accounts/[you]/history`](../../../pages/accounts/[account]/history.tsx) · Rewards    | **Primary for delegators.** Rounds that paid you → receipt (cap math + your share). May deep-link the node’s round. |
| Live status      | [`/accounts/[node]/orchestrating`](../../../pages/accounts/[account]/orchestrating.tsx) | Entry only → node History · Rewards. 802 keeps the live card.                                                       |
| Live status      | [`/accounts/[you]/delegating`](../../../pages/accounts/[account]/delegating.tsx)        | Entry only → your History · Rewards (or node receipt with `?as=`).                                                  |
| -                | Home, `/orchestrators`, Delegators, new `/rewards`                                      | Out.                                                                                                                |

Same shell on both History homes. Product defaults the last mile from whose account you’re on (node → Node pools; you → Your payouts). The mock toggle is review-only.

Do not add a top-level “Rewards” product page. Today’s History tab is only a tx chronology (`components/HistoryView/`); that feed lists `RewardEvent` amounts without saying what capped them. 803 reuses the tab for past _rewards_, not for a second live MFS card.

### IA rule (what went wrong in the first pass)

Wrong: History = 802 status card on top + “recent rounds” below.  
Right: History = settled rounds list on top + past-tense receipt for the selected round.  
802 vocabulary (“Room to earn”, “Full”) stays on Orchestrating / Delegating. Receipt title is just “Round N”; status is wash + list meta + binding tag “capped rewards.”

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

One shell, two account homes. Same math; different last mile (Your payouts vs Node pools).

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
   claimable in round R + RewardsDelayPeriod (7 rounds)
   Score used is the median at claim, not at work time.

6. Cut split (existing rewardCut)
   node_keeps     = pool_lpt × rewardCut
   delegator_pot  = pool_lpt × (1 − rewardCut)

7. One delegator
   you_lpt = delegator_pot × (your_bonded / node_total_stake)
```

Fees in USDC are a separate pot. They are never capped by stake. This surface may footnote fee cut; it does not pretend MFS caps cash.

Plain labels in chrome (History / receipt):

- Title → “Round N” only. Cap status lives in wash color, list meta, and the binding-step tag. **Not** “Room to earn” / “Full” (802 live states).
- Tag on the binding step → “capped rewards” (same idea as 802’s “caps rewards”, past tense).
- Multiplier → “Honesty score at payout” with the 0–1 factor; no validator product.
- Delay → “Worked in round R · Claimable in round R+7” (claimable at `R+7`; list meta may still say “paid” as shorthand for settled).

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
- **Emissions schedule / network-wide mint size.** Share math is stable; mint size is still a draft. Mock uses a sample pot; call that out here, not in the product chrome.
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
| Claimable round                | 4217                      | `R + 7` (`RewardsDelayPeriod`)                                  |
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
3. **Claim vs auto-distribute.** Protocol: claimable at `R+7`. Mock chrome now says **Claimable in round R+7**. If product later auto-distributes, list meta can stay “paid”; adjust if claim is a separate Transactions action.
4. **`transferBond` / 21-round move** stays an 802 copy concern, not a column here.

## Narrative + 802 boundary

- **Do not reprint 802.** Entry points live in the 802 mock. Link only.
- **Don’t bury the lead.** Receipt: amount → why → derivation disclosure → next step → 802 for today.
- List rows: round + status chip + amount. Title is just `Round N`.

## Status icons (shared with 802)

Canonical SVGs: [`../shared/mfs-status-icons.md`](../shared/mfs-status-icons.md).

- Stake binding (past **Stake capped** = live **Room to earn**): trend-up arrow
- Fee binding (past **Fees capped** = live **Full**): filled circle
- Do not invent per-ticket icons

## Accessibility (APG / AGENTS.md)

Mock implements these; product must keep them:

| Concern                     | Pattern in mock                                                                                            |
| --------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Screen reader selection     | `radiogroup` + `role="radio"` for History mode, reader, and round list; arrow/Home/End + roving `tabindex` |
| Selection change            | `aria-live="polite"` announces round, cap side, and amount                                                 |
| Colorblind / not color-only | Chip = icon + label + border; selected row uses a full 1.5px brand border + wash + weight (no left bar)    |
| Focus                       | Visible `:focus-visible`; mobile drill-in moves focus to receipt; Back restores focus to selected round    |
| Help                        | `?` buttons ≥24px hit target; tooltip on `:focus-within` / hover via `aria-describedby`                    |
| Motion                      | `prefers-reduced-motion` → no smooth scroll                                                                |
| Semantics                   | Prefer native/`radiogroup` over fake `listbox`; decorative SVG `aria-hidden`                               |

## Acceptance

Design mock + this rationale, posted for approval by @ECWireless. No product UI in `pages/` or `components/` until that gate.
