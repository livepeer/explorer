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

export type PerformanceMetrics = {
  successRates: RegionalValues;
  roundTripScores: RegionalValues;

  scores: RegionalValues;

  pricePerPixel: number;

  topAIScore: Score;
};

export type AllPerformanceMetrics = {
  [key: string]: PerformanceMetrics;
};
