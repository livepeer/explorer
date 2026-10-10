import { z } from "zod";

export const DayDataSchema = z.array(
  z.object({
    dateS: z.number(),
    volumeEth: z
      .number()
      .nullish()
      .transform((val) => val ?? 0),
    volumeUsd: z
      .number()
      .nullish()
      .transform((val) => val ?? 0),
    feeDerivedMinutes: z
      .number()
      .nullish()
      .transform((val) => val ?? 0),
    participationRate: z
      .number()
      .nullish()
      .transform((val) => val ?? 0),
    inflation: z
      .number()
      .nullish()
      .transform((val) => val ?? 0),
    activeTranscoderCount: z
      .number()
      .nullish()
      .transform((val) => val ?? 0),
    delegatorsCount: z
      .number()
      .nullish()
      .transform((val) => val ?? 0),
  })
);

// Helper schema for chart structure
const WeeklyDataSchema = z.object({
  date: z.number(),
  weeklyVolumeUsd: z.number(),
  weeklyVolumeEth: z.number(),
  weeklyUsageMinutes: z.number(),
});

export const UsageOutputSchema = z.object({
  dayData: DayDataSchema, // Reusing the schema above strictly for structure
  weeklyData: z.array(WeeklyDataSchema),
  oneDayVolumeUSD: z.number(),
  oneDayVolumeETH: z.number(),
  oneWeekVolumeUSD: z.number(),
  oneWeekVolumeETH: z.number(),
  oneDayUsage: z.number(),
  oneWeekUsage: z.number(),
  dailyUsageChange: z.number(),
  weeklyUsageChange: z.number(),
  weeklyVolumeChangeUSD: z.number(),
  weeklyVolumeChangeETH: z.number(),
  volumeChangeUSD: z.number(),
  volumeChangeETH: z.number(),
  participationRateChange: z.number(),
  inflationChange: z.number(),
  delegatorsCountChange: z.number(),
  activeTranscoderCountChange: z.number(),
  participationRate: z.number(),
  inflation: z.number(),
  activeTranscoderCount: z.number(),
  delegatorsCount: z.number(),
});
