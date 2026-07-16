export type RegionalValues = {
  [key: string]: number;
};
export type Score = {
  value: number;
  region: string;
  model: string;
  pipeline: string;
  orchestrator: string;
};

// Null means the upstream could not be reached; empty or zero means no data.
export type PerformanceMetrics = {
  successRates: RegionalValues | null;
  roundTripScores: RegionalValues | null;

  scores: RegionalValues | null;

  pricePerPixel: number | null;

  topAIScore: Score | null;
};

export type AllPerformanceMetrics = {
  [key: string]: PerformanceMetrics;
};
