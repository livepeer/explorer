export type WeeklyData = {
  date: number;
  weeklyVolumeUsd: number;
  weeklyUsageMinutes: number;
  weeklyVolumeEth: number;
};

export type DayData = {
  // dateTs: string;
  dateS: number;
  // weekTs: string;
  // weekS: number;
  volumeEth: number;
  volumeUsd: number;
  feeDerivedMinutes: number;
  participationRate: number;
  inflation: number;
  activeTranscoderCount: number;
  delegatorsCount: number;
  // averagePricePerPixel: number;
  // averagePixelPerMinute: number;
};

export type HomeChartData = {
  dayData: DayData[];
  weeklyData: WeeklyData[];
  // totalVolumeUSD: number;
  // totalVolumeETH: number;
  // totalUsage: number;
  participationRate: number;
  inflation: number;
  activeTranscoderCount: number;
  delegatorsCount: number;
  oneDayVolumeUSD: number;
  oneDayVolumeETH: number;
  oneWeekVolumeUSD: number;
  oneWeekVolumeETH: number;
  oneWeekUsage: number;
  oneDayUsage: number;
  dailyUsageChange: number;
  weeklyVolumeChangeUSD: number;
  weeklyVolumeChangeETH: number;
  weeklyUsageChange: number;
  volumeChangeUSD: number;
  volumeChangeETH: number;
  participationRateChange: number;
  inflationChange: number;
  activeTranscoderCountChange: number;
  delegatorsCountChange: number;
};
