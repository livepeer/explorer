import { HomeChartData, WeeklyData } from "@lib/api/types/get-chart-data";
import { IS_TESTNET } from "@lib/chains";
import {
  getBlocksFromTimestamps,
  getLivepeerComUsageData,
  getPercentChange,
  getTotalFeeDerivedMinutes,
  getTwoPeriodPercentChange,
} from "@lib/utils";
import {
  client,
  DaysDocument,
  DaysQuery,
  DaysQueryVariables,
  Day_OrderBy,
  OrderDirection,
  ProtocolByBlockDocument,
  ProtocolByBlockQuery,
  ProtocolByBlockQueryVariables,
  ProtocolDocument,
  ProtocolQuery,
  ProtocolQueryVariables,
} from "apollo";
import dayjs from "dayjs";
import { NextApiRequest, NextApiResponse } from "next";

import utc from "dayjs/plugin/utc";
import weekOfYear from "dayjs/plugin/weekOfYear";
import { getCacheControlHeader } from "@lib/api";

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
      const data: HomeChartData = {
        dayData: [],
        weeklyData: [],
        totalVolumeUSD: 0,
        totalVolumeETH: 0,
        totalUsage: 0,
        participationRate: 0,
        inflation: 0,
        activeTranscoderCount: 0,
        delegatorsCount: 0,
        oneDayVolumeUSD: 0,
        oneDayVolumeETH: 0,
        oneWeekVolumeUSD: 0,
        oneWeekVolumeETH: 0,
        oneWeekUsage: 0,
        oneDayUsage: 0,
        dailyUsageChange: 0,
        weeklyVolumeChangeUSD: 0,
        weeklyVolumeChangeETH: 0,
        weeklyUsageChange: 0,
        volumeChangeUSD: 0,
        volumeChangeETH: 0,
        participationRateChange: 0,
        inflationChange: 0,
        activeTranscoderCountChange: 0,
        delegatorsCountChange: 0,
      };

      // Date to price mapping used to calculate estimated usage
      // based on the Livepeer.com broadcaster's max price
      const pricePerPixel = [
        {
          startDate: 1577836800,
          endDate: 1616457600,
          price: 0.000000000000006, // (6000 wei)
        },
        {
          startDate: 1616457600,
          endDate: 1620201600,
          price: 0.000000000000003, // (3000 wei)
        },
        {
          startDate: 1620201600,
          endDate: 1621465200,
          price: 0.0000000000000006,
        }, // (600 wei),
        { startDate: 1621465200, endDate: Infinity, price: 0.0000000000000012 }, // (1200 wei)
      ];

      // the # of pixels in a minute of 240p30fps, 360p30fps, 480p30fps, 720p30fps transcoded renditions.
      // (width * height * framerate * seconds in a minute)
      const pixelsPerMinute = 2995488000;
      // Could be 15 * 848 * 480 * 60 * 0.7 +
      // (15 * 848 * 480 * 60 + 25 * 1280 * 720 * 60) * 0.3;
      // - based on conversations with Evan and Studio database entries for common rendition profiles

      try {
        // get timestamps for the days
        const utcCurrentTime = dayjs();
        const utcOneDayBack = utcCurrentTime.subtract(1, "day").unix();
        const utcTwoDaysBack = utcCurrentTime.subtract(2, "day").unix();
        const utcOneWeekBack = utcCurrentTime.subtract(1, "week").unix();
        const utcTwoWeeksBack = utcCurrentTime.subtract(2, "week").unix();

        // get the blocks needed for time travel queries
        const [oneDayBlock, twoDayBlock, oneWeekBlock, twoWeekBlock] =
          await getBlocksFromTimestamps([
            utcOneDayBack,
            utcTwoDaysBack,
            utcOneWeekBack,
            utcTwoWeeksBack,
          ]);

        const getDayData = async () => {
          const result = await client.query<DaysQuery, DaysQueryVariables>({
            query: DaysDocument,
            fetchPolicy: "network-only",
            variables: {
              first: 1000,
              orderBy: Day_OrderBy.Date,
              orderDirection: OrderDirection.Desc,
            },
          });
          return result;
        };

        const getProtocolData = async () => {
          const result = await client.query<
            ProtocolQuery,
            ProtocolQueryVariables
          >({
            query: ProtocolDocument,
            fetchPolicy: "network-only",
          });
          return result;
        };

        const getProtocolDataByBlock = async (_block) => {
          const result = await client.query<
            ProtocolByBlockQuery,
            ProtocolByBlockQueryVariables
          >({
            query: ProtocolByBlockDocument,
            fetchPolicy: "network-only",
            variables: {
              block: { number: _block },
            },
          });
          return result;
        };

        const dayDataResult = await getDayData();
        const dayData = dayDataResult.data.days;

        let livepeerComDayData: any[] = [];
        let livepeerComOneDayData: any[] = [];
        let livepeerComTwoDaysData: any[] = [];
        let livepeerComOneWeekData: any[] = [];
        let livepeerComTwoWeekData: any[] = [];

        // No need to fetch usage data on testnets
        if (!IS_TESTNET) {
          const fromTime =
            process.env.NEXT_PUBLIC_NETWORK === "ARBITRUM_ONE"
              ? +new Date("February 16, 2022 00:00:00")
              : +new Date("2020, 0");
          livepeerComDayData = await getLivepeerComUsageData({
            fromTime,
            toTime: +new Date(),
          });
          livepeerComOneWeekData = await getLivepeerComUsageData({
            fromTime,
            toTime: utcOneWeekBack * 1000, // api uses milliseconds
          });
          livepeerComTwoWeekData = await getLivepeerComUsageData({
            fromTime,
            toTime: utcTwoWeeksBack * 1000, // api uses milliseconds
          });
          livepeerComOneDayData = await getLivepeerComUsageData({
            fromTime,
            toTime: utcOneDayBack * 1000, // api uses milliseconds
          });
          livepeerComTwoDaysData = await getLivepeerComUsageData({
            fromTime,
            toTime: utcTwoDaysBack * 1000, // api uses milliseconds
          });
        }

        let totalFeeDerivedMinutes = 0;
        let totalFeeDerivedMinutesOneDayAgo = 0;
        let totalFeeDerivedMinutesTwoDaysAgo = 0;
        let totalFeeDerivedMinutesOneWeekAgo = 0;
        let totalFeeDerivedMinutesTwoWeeksAgo = 0;
        let pricePerPixelIndex = pricePerPixel.length - 1;

        // merge in Livepeer.com usage data
        const mergedDayData = dayData.map((item) => {
          const found: { sourceSegmentsDuration: number } | undefined =
            livepeerComDayData.find(
              (element: any) => item.date === element?.date
            );

          // if Livepeer.com's broadcaster changed max price, use updated price
          if (
            pricePerPixelIndex &&
            item.date < pricePerPixel[pricePerPixelIndex].startDate
          ) {
            pricePerPixelIndex--;
          }

          const feeDerivedMinutes = getTotalFeeDerivedMinutes({
            pricePerPixel: pricePerPixel[pricePerPixelIndex].price,
            totalVolumeETH: +item.volumeETH,
            totalVolumeUSD: +item.volumeUSD,
            pixelsPerMinute,
          });

          totalFeeDerivedMinutes += feeDerivedMinutes;

          if (item.date < utcOneDayBack) {
            totalFeeDerivedMinutesOneDayAgo += feeDerivedMinutes;
          }
          if (item.date < utcTwoDaysBack) {
            totalFeeDerivedMinutesTwoDaysAgo += feeDerivedMinutes;
          }

          if (item.date < utcOneWeekBack) {
            totalFeeDerivedMinutesOneWeekAgo += feeDerivedMinutes;
          }
          if (item.date < utcTwoWeeksBack) {
            totalFeeDerivedMinutesTwoWeeksAgo += feeDerivedMinutes;
          }

          // combine Livepeer.com minutes with minutes calculated via fee volume
          const minutes =
            (found?.sourceSegmentsDuration ?? 0) / 60 + feeDerivedMinutes;
          return { ...item, ...found, minutes };
        });

        // get total Livepeer.com aggregate usage
        const totalLivepeerComUsage = livepeerComDayData.reduce((x, y) => {
          return x + y.sourceSegmentsDuration / 60;
        }, 0);

        const totalLivepeerComUsageOneWeekAgo = livepeerComOneWeekData.reduce(
          (x, y) => {
            return x + y.sourceSegmentsDuration / 60;
          },
          0
        );

        const totalLivepeerComUsageTwoWeeksAgo = livepeerComTwoWeekData.reduce(
          (x, y) => {
            return x + y.sourceSegmentsDuration / 60;
          },
          0
        );

        const totalLivepeerComUsageOneDayAgo = livepeerComOneDayData.reduce(
          (x, y) => {
            return x + y.sourceSegmentsDuration / 60;
          },
          0
        );

        const totalLivepeerComUsageTwoDaysAgo = livepeerComTwoDaysData.reduce(
          (x, y) => {
            return x + y.sourceSegmentsDuration / 60;
          },
          0
        );

        // fetch the historical data
        const protocolDataResult = await getProtocolData();
        data.totalVolumeUSD = +(
          protocolDataResult.data.protocol?.totalVolumeUSD ?? 0
        );
        data.totalVolumeETH = +(
          protocolDataResult.data.protocol?.totalVolumeETH ?? 0
        );
        data.participationRate = +(
          protocolDataResult.data.protocol?.participationRate ?? 0
        );
        data.inflation = +(protocolDataResult.data.protocol?.inflation ?? 0);
        data.activeTranscoderCount = +(
          protocolDataResult.data.protocol?.activeTranscoderCount ?? 0
        );
        data.delegatorsCount = +(
          protocolDataResult.data.protocol?.delegatorsCount ?? 0
        );

        const oneDayResult = await getProtocolDataByBlock(oneDayBlock);
        const oneDayData = oneDayResult.data.protocol;

        const twoDayResult = await getProtocolDataByBlock(twoDayBlock);
        const twoDayData = twoDayResult.data.protocol;

        const oneWeekResult = await getProtocolDataByBlock(oneWeekBlock);
        const oneWeekData = oneWeekResult.data.protocol;

        const twoWeekResult = await getProtocolDataByBlock(twoWeekBlock);
        const twoWeekData = twoWeekResult.data.protocol;

        const [oneDayVolumeUSD, volumeChangeUSD] = getTwoPeriodPercentChange(
          +data.totalVolumeUSD,
          +(oneDayData?.totalVolumeUSD ?? 0),
          +(twoDayData?.totalVolumeUSD ?? 0)
        );

        const [oneDayVolumeETH, volumeChangeETH] = getTwoPeriodPercentChange(
          +data?.totalVolumeETH,
          +(oneDayData?.totalVolumeETH ?? 0),
          +(twoDayData?.totalVolumeETH ?? 0)
        );

        const [oneWeekVolumeUSD, weeklyVolumeChangeUSD] =
          getTwoPeriodPercentChange(
            +data?.totalVolumeUSD,
            oneWeekData?.totalVolumeUSD ? +oneWeekData?.totalVolumeUSD : 0,
            twoWeekData?.totalVolumeUSD ? +twoWeekData?.totalVolumeUSD : 0
          );

        const [oneWeekVolumeETH, weeklyVolumeChangeETH] =
          getTwoPeriodPercentChange(
            +data?.totalVolumeETH,
            oneWeekData?.totalVolumeETH ? +oneWeekData?.totalVolumeETH : 0,
            twoWeekData?.totalVolumeETH ? +twoWeekData?.totalVolumeETH : 0
          );

        const [oneWeekUsage, weeklyUsageChange] = getTwoPeriodPercentChange(
          totalLivepeerComUsage + totalFeeDerivedMinutes,
          totalLivepeerComUsageOneWeekAgo + totalFeeDerivedMinutesOneWeekAgo,
          totalLivepeerComUsageTwoWeeksAgo + totalFeeDerivedMinutesTwoWeeksAgo
        );

        const [oneDayUsage, dailyUsageChange] = getTwoPeriodPercentChange(
          totalLivepeerComUsage + totalFeeDerivedMinutes,
          totalLivepeerComUsageOneDayAgo + totalFeeDerivedMinutesOneDayAgo,
          totalLivepeerComUsageTwoDaysAgo + totalFeeDerivedMinutesTwoDaysAgo
        );

        // format the total participation change
        const participationRateChange = getPercentChange(
          data?.participationRate,
          oneDayData?.participationRate
        );
        const inflationChange = getPercentChange(
          data?.inflation,
          oneDayData?.inflation
        );
        const activeTranscoderCountChange = getPercentChange(
          data?.activeTranscoderCount,
          oneDayData?.activeTranscoderCount
        );
        const delegatorsCountChange = getPercentChange(
          data?.delegatorsCount,
          oneDayData?.delegatorsCount
        );

        // format weekly data for weekly sized chunks
        const weeklySizedChunks = mergedDayData.sort((a, b) =>
          a.date > b.date ? 1 : -1
        );
        let startIndexWeekly = -1;
        let currentWeek = -1;

        const weeklyData: WeeklyData[] = [];

        for (const weeklySizedChunk of weeklySizedChunks) {
          const week = dayjs.utc(dayjs.unix(weeklySizedChunk.date)).week();
          if (week !== currentWeek) {
            currentWeek = week;
            startIndexWeekly++;
          }
          weeklyData[startIndexWeekly] = {
            date: weeklySizedChunk.date,
            weeklyVolumeUSD:
              (weeklyData?.[startIndexWeekly]?.weeklyVolumeUSD ?? 0) +
              +weeklySizedChunk.volumeUSD,
            weeklyUsageMinutes:
              (weeklyData?.[startIndexWeekly]?.weeklyUsageMinutes ?? 0) +
              weeklySizedChunk.minutes,
          };
        }

        // add relevant fields with the calculated amounts
        data.dayData = mergedDayData
          .filter((day) => Number(day.inflation))
          .sort((a, b) => (a.date > b.date ? 1 : -1));

        data.weeklyData = weeklyData;
        data.oneDayVolumeUSD = oneDayVolumeUSD;
        data.oneDayVolumeETH = oneDayVolumeETH;
        data.oneWeekVolumeUSD = oneWeekVolumeUSD;
        data.oneWeekVolumeETH = oneWeekVolumeETH;
        data.totalUsage = totalFeeDerivedMinutes + totalLivepeerComUsage;
        data.oneDayUsage = totalFeeDerivedMinutes ? oneDayUsage : 0;
        data.oneWeekUsage = totalFeeDerivedMinutes ? oneWeekUsage : 0;
        data.dailyUsageChange = totalFeeDerivedMinutes ? dailyUsageChange : 0;
        data.weeklyUsageChange = totalFeeDerivedMinutes ? weeklyUsageChange : 0;
        data.weeklyVolumeChangeUSD = weeklyVolumeChangeUSD;
        data.weeklyVolumeChangeETH = weeklyVolumeChangeETH;
        data.volumeChangeUSD = volumeChangeUSD;
        data.volumeChangeETH = volumeChangeETH;
        data.participationRateChange = participationRateChange;
        data.inflationChange = inflationChange;
        data.delegatorsCountChange = delegatorsCountChange;
        data.activeTranscoderCountChange = activeTranscoderCountChange;

        if (
          Number(
            data?.dayData?.[(data?.dayData?.length ?? 1) - 1]
              ?.activeTranscoderCount
          ) <= 0
        ) {
          data.dayData = data.dayData.slice(0, -1);
        }
      } catch (e) {
        console.error(e);
        return res.status(500).json(null);
      }

      res.setHeader("Cache-Control", getCacheControlHeader("day"));

      return res.status(200).json(data);
    }

    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${method} Not Allowed`);
  } catch (err) {
    console.error(err);
    return res.status(500).json(null);
  }
};

export default chartDataHandler;
