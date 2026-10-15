# Livepeer 2.0 Litepaper — cliff notes

**Source:** [Livepeer_2.0_Litepaper_September_2026_Draft.pdf](../Livepeer_2.0_Litepaper_September_2026_Draft.pdf) (Doug Petkanics, September 2026 draft).  
**Job of this file:** short KV-style facts for Explorer design tickets ([#802](https://github.com/livepeer/explorer/issues/802) MFS compare, [#803](https://github.com/livepeer/explorer/issues/803) reward history, [#804](https://github.com/livepeer/explorer/issues/804) validators). Prefer this over inventing protocol. If a review bot conflicts with rows below, keep the litepaper.

Do not paste the full paper here. Open the PDF for nuance.

---

## Principles (design filter)

| Key                      | Value                                                                       |
| ------------------------ | --------------------------------------------------------------------------- |
| Rewards follow real work | Inflationary LPT during bootstrap is driven by honest fees, not stake alone |
| Roles must do work       | Pure stake rent-seeking roles get redesigned into active value              |
| Governance knobs         | Prefer adjustable parameters over rigid elegance                            |
| Simplicity               | Operators and delegators must be able to reason about the mechanism         |

---

## Roles

| Key           | Value                                                                                                                           |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Node operator | Runs compute / APIs / media work. Permissionless registration. No fixed LPT bond. No 100-node cap.                              |
| Validator     | Scores honesty. Same participant pool as nodes: top N by stake who opt in.                                                      |
| Delegator     | Bonds to nodes (existing cut mechanics). More active: routes stake to understaked high-fee nodes; also elects who can validate. |
| Naming        | Litepaper: “node operator.” Explorer today: “orchestrator.” Renaming is separate.                                               |

---

## MFS (min fee-stake) — core formula

| Key                   | Value                                                                                                      |
| --------------------- | ---------------------------------------------------------------------------------------------------------- |
| Formula               | `reward % = min(fee % of network, stake % of network)`                                                     |
| Fee %                 | Node’s USDC fees / network USDC fees (that round / window)                                                 |
| Stake %               | Node stake (self + delegated) / network stake                                                              |
| Fees themselves       | **Never capped** by stake. More real work → more USDC.                                                     |
| LPT attached to work  | **Capped** by stake share.                                                                                 |
| Understaked example   | 10% fees, 2% stake → LPT reward share capped at **2%** until stake rises                                   |
| Matched example       | 5% fees, 5% stake → full **5%**                                                                            |
| Overstaked / low fees | High stake, low fees → rewards capped by fees; stake is better moved to fee-leading nodes                  |
| Self-deal mitigation  | Low-stake nodes that fabricate fees still only unlock LPT up to their stake share                          |
| UX implication (802)  | Decision is “which side is smaller / how wide is the gap,” not absolute stake or trailing fee volume alone |

Plain line for UI: **Rewards follow the smaller number.**

---

## Delegation market

| Key                 | Value                                                                                             |
| ------------------- | ------------------------------------------------------------------------------------------------- |
| Opportunity         | Stake on a high-fee / low-stake node can raise that node’s reward ceiling (e.g. 2% → toward 10%)  |
| Passive ghost nodes | Set-and-forget stake on non-earning nodes should earn less than stake on fee-earning nodes        |
| Cuts                | Existing reward cut / fee share still apply on top of the capped LPT pot and USDC fees            |
| Unbonding           | **21 rounds** for self + delegated stake (compromise vs 7 too short / 90 too long for delegators) |
| `transferBond`      | Must be removed **or** delayed **21 rounds**, else attackers relocate stake after a score hit     |
| Open tension        | 21-round move friction vs wanting a liquid, active stake market (listed as open question)         |

---

## Validators & honesty (804 core)

| Key          | Value                                                                                                                                      |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Who          | Top **N** nodes by total stake who **register**; N starts at **33**; voluntary; next registered fills declined slots                       |
| Score        | Each validator assigns `RewardMultiplier` ∈ **[0.0, 1.0]** per node                                                                        |
| Aggregate    | **Median** across active validators                                                                                                        |
| Effect       | Scales MFS-eligible LPT: `pool = eligible × median`                                                                                        |
| Purpose      | Catch dishonest behavior (self-deal, fabricated fees, wrong results). **Not** QoS / regional grading (that already shows up as lower fees) |
| Pay          | `ValidatorEmissionShare` **1%** of post-BME LPT mint, split among active validators (small on purpose)                                     |
| Contract     | Scoring implementation address is **governance-swappable** (default decentralized median)                                                  |
| Constitution | Referenced; still needs writing / ratification (open question)                                                                             |

---

## Rewards delay (803 core)

| Key                  | Value                                                                                                               |
| -------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `RewardsDelayPeriod` | **7 rounds**                                                                                                        |
| Claim                | Work from round `R` claimable at **`R+7`**                                                                          |
| Score used           | Median `RewardMultiplier` **at claim time**, not at work time (retroactive)                                         |
| Attack closed        | Spike fees one round and cash out before validators react                                                           |
| Causal story for UI  | Work round → fee/stake shares → `min()` → × multiplier at claim → paid after delay → cut split → delegator pro-rata |

---

## Payments & BME

| Key                 | Value                                                              |
| ------------------- | ------------------------------------------------------------------ |
| Payment currency    | **USDC** (replaces ETH-denominated fees)                           |
| `BMENodeCut`        | **50%** of USDC fees → node (work incentive even when stake-short) |
| `BMENetworkFee`     | **50%** of USDC fees → BME (buy LPT)                               |
| `BMEBurnPercentage` | **100%** of purchased LPT burned (starting)                        |
| Rewards funding     | Separate governed **mint**, not recycled buyback LPT               |
| Goal                | Burn from usage vs mint from schedule → equilibrium over time      |

---

## Emissions (treat as draft)

| Key           | Value                                                                                            |
| ------------- | ------------------------------------------------------------------------------------------------ |
| Status        | Litepaper marks emissions section **OPEN / finish later** after simulation                       |
| Idea draft    | Emissions as % of fees start ~**3200%**, **halve every 2 years**, toward equilibrium ~year 10–12 |
| Hard cap idea | **$50M/year** USD-equivalent mint ceiling (guardrail)                                            |
| Explorer UX   | Prefer **share math** over dollar APY until schedule is settled (802/803 already lean this way)  |

Round mint split (starting):

| Share                    | %   | Goes to                                     |
| ------------------------ | --- | ------------------------------------------- |
| `NodeEmissionShare`      | 94% | Nodes, by work share × aggregate multiplier |
| `ValidatorEmissionShare` | 1%  | Validators (+ their cut / delegators)       |
| `TreasuryEmissionShare`  | 5%  | DAO treasury                                |

---

## Explicitly not in this design

| Out                                      | Why (short)                                                                    |
| ---------------------------------------- | ------------------------------------------------------------------------------ |
| Minimum self-stake for nodes             | Barrier + hot-wallet risk; gateways can still prefer bonded nodes off-protocol |
| Separate migration / election event      | Top-N stake + opt-in validators; continuity                                    |
| Fee ramp for new-node reward eligibility | Replaced by **7-round delay**                                                  |

---

## Parameter cheat sheet (launch defaults)

| Parameter                                                                | Initial                                      |
| ------------------------------------------------------------------------ | -------------------------------------------- |
| Node operator cap                                                        | None                                         |
| Reward formula                                                           | MFS `min(fee%, stake%)`                      |
| `ValidatorSetSize`                                                       | 33                                           |
| `UnbondingPeriod`                                                        | 21 rounds (incl. transferBond delay if kept) |
| `RewardsDelayPeriod`                                                     | 7 rounds                                     |
| Payment currency                                                         | USDC                                         |
| `BMENodeCut` / `BMENetworkFee`                                           | 50% / 50%                                    |
| `BMEBurnPercentage`                                                      | 100%                                         |
| `NodeEmissionShare` / `ValidatorEmissionShare` / `TreasuryEmissionShare` | 94% / 1% / 5%                                |

Most of the above are governance-adjustable; formula shape of MFS is not.

---

## Open questions (do not invent answers in UI)

1. Securing PM payments with unlimited node count
2. Price oracle for emissions (manipulation-resistant)
3. Minimum validator participation / pay tied to participation?
4. `transferBond` vs 21-round friction vs active stake market
5. Validator constitution text + ratification

---

## Ticket map

| Ticket  | Lead with                                                                                        |
| ------- | ------------------------------------------------------------------------------------------------ |
| **802** | Current fee% vs stake%, which side binds, gap, cuts; handoff line to 803 for past payouts        |
| **803** | Past round causality: shares → min → multiplier at claim → R+7 → pool → cuts → your LPT          |
| **804** | Validator set / scores / constitution UX; Explorer + subgraph needs for multipliers and election |

When copy debates “does extra stake earn?”, use litepaper language: **fees never capped**; **LPT reward share follows the smaller of fee% and stake%**; overstaked nodes stay fee-capped until fees rise; understaked high-fee nodes are where new stake still lifts the LPT ceiling.
