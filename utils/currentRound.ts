export function getCurrentRound({
  blockNum,
  lastRoundLengthUpdateStartBlock,
  lastRoundLengthUpdateRound,
  roundLength,
}) {
  // Compute # of rounds since roundLength was last updated
  let roundsSinceUpdate =
    (+blockNum - +lastRoundLengthUpdateStartBlock) / +roundLength;

  // Current round = round that roundLength was last updated + # of rounds since roundLength was last updated
  return Math.round(+lastRoundLengthUpdateRound + roundsSinceUpdate);
}
