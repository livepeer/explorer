import {
  DayData,
  HomeChartData,
  WeeklyData,
} from "@lib/api/types/get-chart-data";
import { getPercentChange } from "@lib/utils";
import dayjs from "dayjs";
import { NextApiRequest, NextApiResponse } from "next";

import { getCacheControlHeader } from "@lib/api";
import { historicalDayData } from "data/historical-usage";
import utc from "dayjs/plugin/utc";
import weekOfYear from "dayjs/plugin/weekOfYear";

// format dayjs with the libraries that we need
dayjs.extend(utc);
dayjs.extend(weekOfYear);

const chartDataHandler = async (
  req: NextApiRequest,
  res: NextApiResponse<HomeChartData | null>
) => {
  try {
    const method = req.method;

    if (method === "GET") {
      const cutoffDate = 1690934400000;
      const currentDate = Date.now();

      const response = await fetch(
        `https://livepeer.com/data/usage/query/total?from=${cutoffDate}&to=${currentDate}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.LIVEPEER_COM_API_ADMIN_TOKEN}`,
          },
        }
      );

      if (!response.ok) {
        return res.status(500).json(null);
      }

      const newApiData: DayData[] = await response.json();

      const mergedDayData: DayData[] = [
        ...historicalDayData.map((day) => ({
          dateS: day.date,
          volumeEth: Number(day.volumeETH),
          volumeUsd: Number(day.volumeUSD),
          feeDerivedMinutes: day.minutes,
          participationRate: Number(day.participationRate),
          inflation: Number(day.inflation),
          activeTranscoderCount: Number(day.activeTranscoderCount),
          delegatorsCount: Number(day.delegatorsCount),
        })),
        ...newApiData,
      ];

      const sortedDays = mergedDayData.sort((a, b) =>
        a.dateS > b.dateS ? 1 : -1
      );

      try {
        let startIndexWeekly = -1;
        let currentWeek = -1;

        const weeklyData: WeeklyData[] = [];

        for (const day of sortedDays) {
          const week = dayjs.utc(dayjs.unix(day.dateS)).week();
          if (week !== currentWeek) {
            currentWeek = week;
            startIndexWeekly++;

            weeklyData.push({
              date: day.dateS,
              weeklyVolumeUsd: 0,
              weeklyVolumeEth: 0,
              weeklyUsageMinutes: 0,
            });
          }

          weeklyData[startIndexWeekly].weeklyVolumeUsd += day.volumeUsd;
          weeklyData[startIndexWeekly].weeklyVolumeEth += day.volumeEth;
          weeklyData[startIndexWeekly].weeklyUsageMinutes +=
            day.feeDerivedMinutes;
        }

        // const currentWeekData = weeklyData[weeklyData.length - 1];
        const oneWeekBackData = weeklyData[weeklyData.length - 2];
        const twoWeekBackData = weeklyData[weeklyData.length - 3];

        const currentDayData = sortedDays[sortedDays.length - 1];
        const oneDayBackData = sortedDays[sortedDays.length - 2];
        // const twoDayBackData = sortedDays[sortedDays.length - 3];

        const dailyUsageChange = getPercentChange(
          currentDayData.feeDerivedMinutes,
          oneDayBackData.feeDerivedMinutes
        );

        const dailyVolumeEthChange = getPercentChange(
          currentDayData.volumeEth,
          oneDayBackData.volumeEth
        );

        const dailyVolumeUsdChange = getPercentChange(
          currentDayData.volumeUsd,
          oneDayBackData.volumeUsd
        );

        const weeklyVolumeUsdChange = getPercentChange(
          oneWeekBackData?.weeklyVolumeUsd ?? 0,
          twoWeekBackData?.weeklyVolumeUsd ?? 0
        );

        const weeklyVolumeEthChange = getPercentChange(
          oneWeekBackData?.weeklyVolumeEth ?? 0,
          twoWeekBackData?.weeklyVolumeEth ?? 0
        );

        const weeklyUsageChange = getPercentChange(
          oneWeekBackData?.weeklyUsageMinutes ?? 0,
          twoWeekBackData?.weeklyUsageMinutes ?? 0
        );

        const participationRateChange = getPercentChange(
          currentDayData?.participationRate,
          oneDayBackData?.participationRate
        );
        const inflationChange = getPercentChange(
          currentDayData?.inflation,
          oneDayBackData?.inflation
        );
        const activeTranscoderCountChange = getPercentChange(
          currentDayData?.activeTranscoderCount,
          oneDayBackData?.activeTranscoderCount
        );
        const delegatorsCountChange = getPercentChange(
          currentDayData?.delegatorsCount,
          oneDayBackData?.delegatorsCount
        );

        const data: HomeChartData = {
          dayData: sortedDays,
          weeklyData: weeklyData,
          oneDayVolumeUSD: currentDayData.volumeUsd,
          oneDayVolumeETH: currentDayData.volumeEth,
          oneWeekVolumeUSD: oneWeekBackData.weeklyVolumeUsd,
          oneWeekVolumeETH: oneWeekBackData.weeklyVolumeEth,
          // totalUsage: totalFeeDerivedMinutes + totalLivepeerComUsage,
          oneDayUsage: currentDayData.feeDerivedMinutes ?? 0,
          oneWeekUsage: oneWeekBackData.weeklyUsageMinutes ?? 0,
          dailyUsageChange: dailyUsageChange ?? 0,
          weeklyUsageChange: weeklyUsageChange ?? 0,
          weeklyVolumeChangeUSD: weeklyVolumeUsdChange,
          weeklyVolumeChangeETH: weeklyVolumeEthChange,
          volumeChangeUSD: dailyVolumeUsdChange,
          volumeChangeETH: dailyVolumeEthChange,
          participationRateChange: participationRateChange,
          inflationChange: inflationChange,
          delegatorsCountChange: delegatorsCountChange,
          activeTranscoderCountChange: activeTranscoderCountChange,

          participationRate:
            sortedDays[sortedDays.length - 1].participationRate,
          inflation: sortedDays[sortedDays.length - 1].inflation,
          activeTranscoderCount:
            sortedDays[sortedDays.length - 1].activeTranscoderCount,
          delegatorsCount: sortedDays[sortedDays.length - 1].delegatorsCount,
        };

        res.setHeader("Cache-Control", getCacheControlHeader("day"));

        return res.status(200).json(data);
      } catch (e) {
        console.error(e);
        return res.status(500).json(null);
      }
    }

    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${method} Not Allowed`);
  } catch (err) {
    console.error(err);
  }

  return res.status(500).json(null);
};

export default chartDataHandler;
