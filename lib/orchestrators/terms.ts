/**
 * What the orchestrator figures mean, in one place: the Orchestrators
 * table's headers and an orchestrator's own page explain them the same way.
 */
export const TERMS = {
  realisedApr:
    "What delegators actually earned, annualised: inflation rewards over the last 30 rounds plus ETH fees over the last 90 days, valued at today's ETH/LPT price. Fees an orchestrator paid itself as a gateway are left out.",
  rewardCalls:
    "Completed rounds in which the orchestrator called reward, out of the last 30 it was active. A missed call means its delegators earn no rewards that round.",
  rewardCut: "Share of inflationary rewards the orchestrator keeps.",
  feeShare: "Share of ETH fees passed on to delegators.",
  totalStake:
    "LPT delegated to this orchestrator, its own included. More stake earns a larger share of rewards and work.",
  fees30d:
    "ETH earned for transcoding and AI work over the last 30 days, before its fee share is passed on.",
  treasuryVotes:
    "Of the treasury proposals that opened for voting while this orchestrator was active, how many it voted on. Its vote carries its delegators' stake unless they vote themselves.",
} as const;
