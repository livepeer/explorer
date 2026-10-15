# 802: Where MFS shows up

Decision for [livepeer/explorer#802](https://github.com/livepeer/explorer/issues/802). Grounded in the September 2026 Livepeer 2.0 litepaper draft and the current Explorer surfaces. [803](https://github.com/livepeer/explorer/issues/803) (reward history) and [804](https://github.com/livepeer/explorer/issues/804) (validator UX) should hang off this, not get designed inside it.

Protocol KV: [`../../livepeer-2.0-litepaper-cliffnotes.md`](../../livepeer-2.0-litepaper-cliffnotes.md) (prefer over inventing; do not counter the PDF).  
Mockups: [`index.html`](./index.html) in this folder (Inter via [`../shared/`](../shared/)). PDF: [`../../Livepeer_2.0_Litepaper_September_2026_Draft.pdf`](../../Livepeer_2.0_Litepaper_September_2026_Draft.pdf).

## Put it on the orchestrator list, explain it on the orchestrating page

MFS is a property of a node relative to the whole network:

```text
reward % = min(fee % of network, stake % of network)
```

Fees themselves are never capped. Only the inflationary LPT attached to that work is capped by stake (self-stake plus delegated). A node at 10% of fees and 2% of stake earns 2% of node emissions until someone stakes the gap. A node at 2% of fees and 10% of stake earns 2%, and extra stake earns nothing until fees catch up.

That comparison is the job. It already has a home.

| Surface                                                                                    | Role for 802                                                                                                                                                                                  |
| ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`/orchestrators`](../../../pages/orchestrators.tsx)                                       | Primary. This is the market. Prospective delegators compare nodes here. Default sort and the lead columns change.                                                                             |
| [`/accounts/[account]/orchestrating`](../../../pages/accounts/[account]/orchestrating.tsx) | Primary explanation, and the page the list already uses as Delegate. One node, with the formula filled in, before anyone signs. Operators read the same block as "how much stake am I short." |
| [`/accounts/[account]/delegating`](../../../pages/accounts/[account]/delegating.tsx)       | Secondary. Current delegators only. One card for the node they are on, plus a link back to the list. Not a second market.                                                                     |
| Home, leaderboard, history                                                                 | Out of 802. Home stays a network dashboard. History is 803.                                                                                                                                   |

Do not add an "MFS" page. Prospective delegators do not have an account page yet, and a new route would split the comparison they already do on `/orchestrators`.

The list today sorts and columns the wrong quantities for this formula. Delegated stake is an absolute LPT number, not a share of the network. Trailing 90D fees are ETH totals, not a fee share, and 2.0 prices fees in USDC. The earnings sort assumes inflation is paid in proportion to stake. Under MFS that forecast is wrong whenever fee share and stake share differ. Those columns can stay as context. They cannot stay the decision.

## Copy rules

The audience is a prospective delegator, not a protocol engineer. Write for a smart twelve-year-old and be direct about what is a good move.

- Lead with what the user gets ("Room to earn"), put the mechanism one layer down in tooltips.
- No jargon in visible labels: no "headroom", no "MFS", no "min-fee-stake", no "binding constraint". The formula lives in tooltips and docs.
- Numbers carry the comparison everywhere. Do not use dual bars with a shared cut line: that reads as "N% of each bar," which is the wrong story. Rewards equal the smaller share, not a slice of both.
- Eyebrows (small uppercase labels) are for supplementary metadata only. Cards and blocks get real title-case headers, matching the product's existing `Stat` labels.
- The formula in five plain words: "Rewards follow the smaller number."

## Color means which side is smaller, nothing else

The two states are not good and bad. They are which quantity happens to be the minimum right now. So the colors map to the quantities, permanently:

- **Brand blue is fees.** Always. Tags, highlights, the "Full" state. ([livepeer.org/brand](https://livepeer.org/brand) blue.)
- **Brand green is stake.** Always. Tags, highlights, the "Room to earn" state. Stake is LPT / shares, so it uses the Livepeer green. Green here means the stake quantity, not “good.”
- A node's state takes the color of the binding side, and the whole MFS block on the orchestrating page takes a faint undertone of that color (6-7% wash over the panel, tinted border), so the state is felt before a word is read.
- **Never amber** for either state (amber reads as “warning”). Governance grass/tomato/neutral stay reserved for For/Against/Abstain and are not reused here.
- State is always carried by text as well as color. Chips have labels plus a small icon (not a color-only dot): trending-up for "Room to earn", filled disc for "Full", balance scale for "Balanced". Fresh registrations use a launch checklist (no redundant "New" / "Day one" status pill). The binding number has a "caps rewards" tag, and every visual has an `aria-label` that reads the comparison aloud.

## What 802 does not own

**803, reward history.** 802 is the current state: which side is smaller, how wide the gap is, what a move would change. 803 is why a past round paid what it paid. The orchestrating page gets one line, "rewards are paid about a week after the round", that links into 803. No chart and no per-round table here.

**804, validators.** Out of scope for 802 entirely. No score column, no `RewardMultiplier` multiply line, no "rewards paused" state, no honesty-score copy. That product ships on its own ticket; do not prefire it into the MFS surfaces.

## Users and jobs

Explorer copy can keep saying "orchestrator." The litepaper says "node operator." Renaming is a separate ticket. Below, "node" means that orchestrator.

### Prospective delegator

Has LPT, or is about to, and has not bonded. No delegating page exists for them yet.

**Job:** put stake on a node whose fees are ahead of its stake, so the stake actually lifts the reward ceiling, and know the cost of being wrong.

They need, in order:

1. Which nodes have room: fee % above stake %. That is the only place new stake still earns inflation.
2. How wide the gap is, as a share of the network, not as a raw LPT pile.
3. What the node keeps. Reward cut comes out of the capped LPT; fee cut comes out of USDC fees, which are never capped.
4. That moving later costs about 21 days. The litepaper's whole point is that delegation stops being risk-free yield. The unbond applies to delegators, and `transferBond` is either removed or delayed 21 rounds so a penalized node cannot walk its stake to a fresh address. That tradeoff is still an open question. The UI has to show the lockup beside every move affordance, and the copy has to be conditional until the parameter is settled.

They do not need a dollar APY. The emissions schedule in the litepaper is still an unfinished draft. Share math is stable. Mint size is not.

### Current delegator

Already bonded. Lands on `/accounts/[account]/delegating`.

**Job:** tell whether the node they are on is full (stake sitting idle relative to work) or still has room, and whether leaving is worth about 21 days of illiquidity.

The delegating page answers "your node is full" or "your stake is helping this node earn more" and links to `/orchestrators`. The comparison itself stays on the list. Chasing a one-round fee spike is the attack the 7-round reward delay exists to stop, so this page must not rank alternatives off a single round.

### Passive delegator

The litepaper is explicit that set-and-forget stake on a node that does not earn fees should earn less than stake on a node that does. Their job is not "optimize every round." Explorer's job is to make the cost of staying visible: plenty of stake, near-zero fees, rewards capped by fees. One card and a link. No nag loop.

### Orchestrator (node operator)

Same numbers, other sentence. The orchestrating page is already public, so operators and delegators can share it.

**Job:** see whether more stake would uncap inflationary rewards, or whether more stake would do nothing until fees rise. Then give delegators a page that shows the gap without making them read the formula.

Two states:

- Fees ahead of stake: "Rewards capped by stake." Stake covering the gap still earns. Fees in USDC are paid either way.
- Stake ahead of fees: "Rewards capped by fees." More stake will not raise the LPT reward until fee share catches up.

Permissionless registration with no minimum self-stake means a new operator can appear with no bond. That state belongs on this page as a launch checklist (get found by gateways → win fees → back with stake), with brand green and the Livepeer mark. It should not flood the default list.

### Prospective orchestrator

Deciding whether to register. Out of scope as a flow (no bond, no Explorer registration wizard in this ticket). The only 802 obligation is that the list and the detail page stay true for a node with zero stake: they are allowed to exist, they can earn USDC fees, and their LPT reward is zero until stake shows up.

## Hierarchy

This is the order of importance on both primary surfaces.

1. **State.** "Room to earn" / "Full" / "Balanced". One chip plus a plain sentence. This replaces the old "active / inactive" status, since the 100-orchestrator cap goes away.
2. **Fee share and stake share, same unit, same window.** The smaller one gets a "caps rewards" tag. The min() should be visible, not implied.
3. **The gap.** "New stake earns, up to +9.5%" as subtext under the state. Zero when fees are the cap.
4. **Cut splits (optional disclosure).** How the capped LPT and USDC fees split between delegators and the node.
5. **Cost of moving.** About 21 days, next to Delegate and next to any "move" link. If `transferBond` stays instant, this note is wrong, so treat the delay as the design assumption and flag it.
6. **Context that already exists.** Total stake, regional performance, price, governance participation, 90-day fee volume. Useful for "will this node keep earning fees." Not the sort key.

Reward delay (7 rounds) is a sentence on the detail page and detail for 803. It is not a list column.

## List (`/orchestrators`)

Default sort: where new stake earns the most. "Room to earn" nodes first, widest gap first. "Full" and zero-fee nodes sink. "Balanced" sits in the middle. The sort is stated in plain words above the table: "Sorted by where new stake earns the most."

Lead columns:

| Column        | What it is                                                                                                                                |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Orchestrator  | Unchanged.                                                                                                                                |
| State         | "Room to earn" / "Full" / "Balanced". Text chip, plus one plain subline (Full: "Extra stake earns nothing" / "doesn’t lift the LPT cap"). |
| Fees vs stake | Two number lines: "11.8% of fees", "2.3% of stake". The smaller one carries a "caps rewards" tag. No bars here.                           |
| Reward cap    | `min(fee share, stake share)`, colored by the binding side, with "of network rewards" as the subline.                                     |
| Node keeps    | Quiet: reward cut / fee cut. Detail lives in the optional breakdown on the orchestrating page.                                            |

Demote, do not delete: absolute delegated stake, trailing fee volume, regional scores. Trailing volume is a stability hint. It is denominated in USDC once fees are, and it is not the MFS input.

Window: last 7 settled rounds, aligned with `RewardsDelayPeriod`. A single round is what a self-dealing node spikes. Say the window next to the table. The current unsettled round can be a secondary figure on the detail page, never the default sort. 803 owns the round rows.

Default filter: "Earning now" (nodes with fees or stake inside the window). "All nodes" is one click away, so every registered node stays reachable without letting empty addresses flood the default view. Unlimited registration will otherwise make the table a directory.

Row action stays Delegate → orchestrating page. The destination has to show the lockup before the signature.

## Orchestrating page

One block at the top of the existing stat masonry, themed by state: the panel takes a faint undertone of the binding side's color. Real header, not an eyebrow. Three titles, one component:

- **"Rewards capped by stake"** (green undertone, "Room to earn" chip): "Earns 11.8% of fees, backed by 2.3% of stake. Rewards follow the smaller number, so they cap at 2.3%. New stake keeps earning until the two meet."
- **"Rewards capped by fees"** (blue undertone, "Full" chip): "Backed by 6.8% of stake, earning 4.2% of fees. Rewards follow the smaller number, so they cap at 4.2%. Extra stake earns nothing."
- **"Fees and stake in balance"** (no tint, "Balanced" chip): "Fees and stake are level at about 2.7%. New stake earns only if fees grow too."

Under the sentence, a three-row `min()` comparison (Room to earn / Full): Fees share, Stake share (tag "smaller" on the binding one), then result row "Rewards follow the smaller" with the capped %. Room-to-earn adds "room left +N%"; Full adds "extra stake earns nothing." On Balanced, keep the muted `≈ N% of network` line. No dual bars, no shared cut, no 0–max axis.

Under the compare result, cut splits are optional (collapsed by default), like checkout rate details:

- Summary control: "See reward and fee breakdown"
- **Of that N% LPT reward** (the capped amount): Delegators share X% · Node keeps Y%. Pro-rata by stake among delegators.
- **Of this node's USDC fees** (separate pot, not the N%): Delegators share A% · Node keeps B%. Fees are never capped by stake.
- Keep the MFS compare visible; don't force the split on every reader.
- The 50/50 node-vs-network fee split (`BMENodeCut` / `BMENetworkFee`) stays a footnote in the fee tooltip.

Then the existing stats (regional scores, price, calls, governance) stay below. They answer "is the work real", which is how fees get earned. They do not answer the cap.

Beside the delegate control:

- "Moving stake takes about 21 days. It starts earning on the new node only after that." Write this so it can flip if `transferBond` is not delayed.
- "Rewards are paid about a week after the round." Link: reward history (803).

Operator reading is the same block. No separate dashboard in 802. If we later know the viewer owns the node, the stake-capped title can lead with "you are short N stake share." Not required for the first design.

## Delegating page

One card for the current delegate, same themed treatment, linking to `/accounts/[delegate]/orchestrating` and to `/orchestrators`.

Examples:

- "Everstake · Full. This node has more stake than work, so extra stake earns nothing. See nodes with room to earn →"
- "Titan Node · Room to earn. Your stake is helping this node earn more. Moving takes about 21 days. View node →"

Pending fees become USDC when the protocol does. That is a unit change, not this design. Lifetime rewards stay. The explanation of how a given round was capped is 803, linked from here.

## Empty, sparse, wrong

- New node, no stake, no fees: launch checklist on the detail page (gateways → fees → stake). Hidden from the default list, reachable under "All nodes".
- Fees and no stake: capped by stake at 0%. The gap equals the fee share. This is the delegator opportunity the litepaper describes. It must be obvious, not buried under "inactive".
- Stake and no fees: capped by fees. The ghost-node case. State copy says rewards are capped by fees, not "inactive" in the old active-set sense.
- Very long identity, tiny shares, huge shares: tabular numbers, shares formatted with enough precision that 0.4% and 0.04% do not collapse.

## Data this needs, and does not have

Today the orchestrator query gives absolute stake, lifetime and 90-day ETH volume, and cuts. It does not give fee share or stake share of the network per round.

802 needs, per node and for the network, over a 7-round settled window:

- fee total in USDC
- stake (self + delegated)
- derived fee share, stake share, `min()`, gap
- reward cut, fee cut (already present)

Per-round series of those same fields is 803's schema, not a second one. Design 802's window as a sum over the rounds 803 will store. Validator score fields belong to 804, not this ticket.

## Status icons (shared with 803)

Canonical SVGs: [`../shared/mfs-status-icons.md`](../shared/mfs-status-icons.md).

- **Room to earn** (stake binding) = trend-up arrow · past label on 803: **Stake capped**
- **Full** (fee binding) = filled circle · past label on 803: **Fees capped**
- **Balanced** = scale
- Do not invent alternate chip icons per ticket

## Accessibility (APG / AGENTS.md)

| Concern                     | Pattern in mock                                                                                                   |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Mutually exclusive controls | `radiogroup` + `role="radio"` for registration filter and Delegate/Undelegate; arrow/Home/End + roving `tabindex` |
| Colorblind / not color-only | State chip = icon + label + border; fee/stake lines named in text; `role="img"` + `aria-label` on share pairs     |
| Focus                       | Visible `:focus-visible`; drawer toggle `aria-expanded` / Escape closes; amount field focused on open             |
| Help                        | `?` ≥24px; tooltip on hover and `:focus-within` via `aria-describedby`                                            |
| Motion                      | `prefers-reduced-motion` on scroll-into-view                                                                      |
| Skip link                   | Present to first section                                                                                          |

## Open protocol choices that change the UI

- **`transferBond` vs the 21-round delay.** The litepaper wants an active delegation market and also wants stake unable to flee a penalized node. Those conflict. Design for a delayed move. If transfers stay instant, delete the lockup note rather than leaving a lie.
- **Emissions.** Do not show APY, "5× daily rewards", or a dollar mint. Do show "this stake raises the node's ceiling from 2% toward 10% of node rewards." The ceiling ratio is the formula. The mint size is still a draft.
- **Single-round display.** Resist it on the list even if the subgraph makes it easy. Spikes are the attack.
- **Naming and the active set.** "Active" today means "in the capped orchestrator set." After 2.0 it does not. Shipping MFS states under the old status will teach the wrong model.
