import { ALL_REGIONS } from "utils/allRegions";

export type RegionalValues = {
  [key in keyof typeof ALL_REGIONS]: number;
};

export type PerformanceMetrics = {
  successRates: RegionalValues;
  roundTripScores: RegionalValues;

  scores: RegionalValues;

  pricePerPixel: number;
};

export type AllPerformanceMetrics = {
  [key: string]: PerformanceMetrics;
};
