# 804: Eng appendix (not the review surface)

**Reviewers:** open [`index.html`](./index.html). Placement, design decisions, open questions, and accessibility live in that page. Do not review this markdown as the rationale.

This file is for implementers after approval: set rule, median, pay split, sample numbers, subgraph fields. 2.0 is not released. Source is the September 2026 litepaper draft. Do not counter it. Do not link or embed that draft in the review page.

Issue: [livepeer/explorer#804](https://github.com/livepeer/explorer/issues/804). Boundaries: [802](https://github.com/livepeer/explorer/issues/802) (live fee vs stake), [803](https://github.com/livepeer/explorer/issues/803) (honesty factor already used on a paid round).

## Set membership

```text
eligible_pool = node operators who have registered as validators
active_set    = top ValidatorSetSize of eligible_pool by total stake
total stake   = self-staked + delegated
ValidatorSetSize starts at 33 (governance-adjustable)
```

A node in the top stake that has not registered is not in the set. The next-highest registered node fills that seat.

| Mock status  | Rule                                       |
| ------------ | ------------------------------------------ |
| In the set   | Registered and inside the 33               |
| Next in line | Registered, stake below the current cutoff |

Sample ranks: the only unregistered nodes above the cutoff are Quarry (7) and Lumen (12). The other 27 seats occupy the undrawn ranks through 35. Mosaic (36) is the first registered node outside. That is why rank 36 can sit outside a set of 33.
| Could join | Not registered, stake above the current cutoff (registering would enter) |

Participation is not membership. A quiet validator stays in the set in this mock.

## Honesty score

Visible chrome says “honesty score”, never the contract name.

```text
each active validator submits a score in [0.0, 1.0] per node
median = median of scores actually submitted
applied at claim time (work round + 7), not at work time
1.0 = full MFS-eligible reward, 0.0 = none, else proportional
```

Not an average over N rounds. The draft does not cap the score at a round count. The 7 rounds are the delay before pay, so validators can still change the median until claim.

On the Orchestrating card the blurb says other validators scored whether this node’s work was honest. The hero is 95%. The 0 to 1 protocol figure is not shown on the card. “How it was scored” is the scores on this node. “How it scored others” is what this validator gave other nodes. Copy does not use the node name. Hovering or focusing a row marks that dot. 803 keeps factors already paid.

Purpose: dishonest work (self-dealing, fabricated fees, incorrect results). Not quality of service.

Mock rule for blanks: omit from the median. Do not impute 0. Open question for the Validator Track.

### Harbor sample (median 0.95)

18 scores on file, sorted:

| Value | Count |
| ----- | ----- |
| 0.40  | 1     |
| 0.80  | 1     |
| 0.90  | 6     |
| 0.95  | 2     |
| 1.00  | 8     |

Even count: median is the mean of the 9th and 10th (both 0.95). 15 of 33 have no score.

## Pay (illustrative)

Parameter table: `ValidatorEmissionShare` is 1% of round LPT emissions, distributed proportional to each validator’s delegated stake, then that node’s reward cut to delegators.

Draft prose also says the 1% is “split among” active validators, which can be read as an equal split. The mock follows the parameter table. Open question.

```text
pot_LPT     = 0.01 × round mint
share_i     = delegated_i / sum(delegated in the active set)
gross_i     = pot_LPT × share_i
```

Sample only, emissions are still a draft:

| Input                          | Value          |
| ------------------------------ | -------------- |
| Round mint                     | 15,000 LPT     |
| Validator pot                  | 150 LPT        |
| Delegated stake inside the set | 19,200,000 LPT |

| Validator | Delegated | Share | Gross    |
| --------- | --------- | ----- | -------- |
| Northbeam | 1,610,400 | 8.4%  | 12.6 LPT |
| Kiln      | 1,080,000 | 5.6%  | 8.4 LPT  |
| Harbor    | 640,200   | 3.3%  | 5.0 LPT  |
| Slate     | 480,100   | 2.5%  | 3.8 LPT  |
| Cinder    | 500,000   | 2.6%  | 3.9 LPT  |
| Reed      | 390,400   | 2.0%  | 3.0 LPT  |

Shares are rounded for the screen. Quiet Slate still receives a gross share. The draft does not tie pay to submission.

## Participation chip (proposed, not protocol)

Last 7 rounds with at least one score submission:

| Chip    | Rounds |
| ------- | ------ |
| Scoring | 6–7    |
| Gaps    | 1–5    |
| Quiet   | 0      |

Shown only for nodes in the set. Not a health grade. Icons are validator-only. Do not reuse the MFS stake/fee icons in `../shared/mfs-status-icons.md`.

## Subgraph / Explorer data

Not in today’s subgraph. Needs, once 2.0 lands:

- `ValidatorSetSize`, registered flag, active-set membership, stake rank (all nodes and among registered)
- total / self / delegated stake
- per active validator, per node: current score, round updated
- per node: median at “now”, count of blanks
- per validator: rounds with a submission in the trailing 7
- round mint or validator pot, once emissions are fixed
- reward cut used on the validator’s delegated stake

802’s live compare and 803’s per-round series stay their own fields. 803 reads the median that was current at claim, not this live board.

## Where it sits on Orchestrating

Product today: left masonry of stats (total stake, status, regional transcoding score, regional AI score, earned fees, price per pixel, fee cut, reward cut, reward calls, last reward round), then treasury participation, then cut history. Delegate / Undelegate is the right rail (drawer under 1200px).

802 puts its fee-vs-stake card first in that left grid, full width, and leaves the stats and the rail. 803 adds only the “paid about a week later” line on that card.

804’s honesty card is the next full-width item, still in the left grid, before those stats. Incoming scores live there. Scores this node has filed stay on `/validators`. Do not add a column to 802’s orchestrator table.

## Validator Track dependencies

- Confirm set rule (top 33 registered by stake, decline fills from the next registered node)
- Missing-score policy
- Equal split vs stake-weighted pot (mock uses stake-weighted)
- Whether pay depends on submission cadence
- Whether a validator’s score on their own node counts like any other
- Constitution / expected behavior (unwritten; Explorer must not invent conduct rules)
- Whether register / submit-score flows belong in Explorer at all

## Acceptance

Design mock in `index.html`, posted for approval by @ECWireless. No product UI in `pages/` or `components/` until that gate. No register, opt-out, or score-submit UI in this ticket.
