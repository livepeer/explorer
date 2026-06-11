export interface ProtocolDay {
  // Unix seconds at the start of the day (matches Day.date in the subgraph).
  dateS: number;
  // Per-round inflation rate, raw BigInt scale (divide by PERCENTAGE_PRECISION_BILLION).
  inflation: number;
  participationRate: number;
  delegatorsCount: number;
  activeTranscoderCount: number;
}

export interface ProtocolDayData {
  // Continuous, gap-free daily series, ascending by date.
  dayData: ProtocolDay[];

  // Latest-day values with their day-over-day percent change.
  inflation: number;
  inflationChange: number;
  participationRate: number;
  participationRateChange: number;
  delegatorsCount: number;
  delegatorsCountChange: number;
  activeTranscoderCount: number;
  activeTranscoderCountChange: number;
}
