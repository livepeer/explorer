import { getCacheControlHeader } from "@lib/api";
import type {
  ProtocolDay,
  ProtocolDayData,
  ProtocolWeek,
} from "@lib/api/types/get-protocol-day-data";
import { CHAIN_INFO, DEFAULT_CHAIN_ID } from "@lib/chains";
import dayjs from "@lib/dayjs";
import { fetchWithRetry } from "@lib/fetchWithRetry";
import { getPercentChange } from "@lib/utils";
import type { NextApiRequest, NextApiResponse } from "next";

const PAGE_SIZE = 1000;
const MAX_PAGES = 50; // Safety bound to prevent infinite loop on malformed data.

const ANOMALOUS_SENDERS = [
  "0xca3331d67e87816adb30d9562a6e8c0623fb7fef",
  "0xc3c7c4c8f7061b7d6a72766eee5359fe4f36e61e",
];
const ANOMALOUS_FROM_DAY = 1787788800;
const ANOMALOUS_DAYS_QUERY = `
  query AnomalousBroadcasterDays($senders: [String!]!, $fromDay: Int!) {
    broadcasterDays(
      first: 1000
      orderBy: date
      orderDirection: asc
      where: { broadcaster_in: $senders, date_gte: $fromDay }
    ) {
      date
      volumeUSD
    }
  }
`;

const DAYS_QUERY = `
  query ProtocolDays($first: Int!, $lastDate: Int!) {
    days(
      first: $first
      orderBy: date
      orderDirection: asc
      where: { date_gt: $lastDate, activeTranscoderCount_gt: 0 }
    ) {
      date
      inflation
      participationRate
      delegatorsCount
      activeTranscoderCount
      volumeUSD
    }
  }
`;

const getAnomalousUsdByDay = async (): Promise<Map<number, number> | null> => {
  const response = await fetchWithRetry(
    CHAIN_INFO[DEFAULT_CHAIN_ID].subgraph,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: ANOMALOUS_DAYS_QUERY,
        variables: { senders: ANOMALOUS_SENDERS, fromDay: ANOMALOUS_FROM_DAY },
      }),
    },
    { retryOnMethods: ["POST"] }
  );

  if (!response.ok) return null;

  const { data, errors } = await response.json();
  if (errors?.length || !Array.isArray(data?.broadcasterDays)) {
    console.error(
      "Invalid subgraph response for anomalous broadcaster days",
      errors
    );
    return null;
  }

  const anomalousUsdByDay = new Map<number, number>();
  for (const day of data.broadcasterDays) {
    const date = Number(day.date);
    anomalousUsdByDay.set(
      date,
      (anomalousUsdByDay.get(date) ?? 0) + Number(day.volumeUSD)
    );
  }
  return anomalousUsdByDay;
};

const protocolDayDataHandler = async (
  req: NextApiRequest,
  res: NextApiResponse<ProtocolDayData | null>
) => {
  try {
    const { method } = req;
    if (method !== "GET") {
      res.setHeader("Allow", ["GET"]);
      return res.status(405).end(`Method ${method} Not Allowed`);
    }

    const anomalousUsdByDay = await getAnomalousUsdByDay();
    if (!anomalousUsdByDay) return res.status(502).json(null);

    const dayData: ProtocolDay[] = [];
    let lastDate = 0;
    for (let page = 0; page < MAX_PAGES; page++) {
      const response = await fetchWithRetry(
        CHAIN_INFO[DEFAULT_CHAIN_ID].subgraph,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: DAYS_QUERY,
            variables: { first: PAGE_SIZE, lastDate },
          }),
        },
        { retryOnMethods: ["POST"] }
      );

      if (!response.ok) return res.status(502).json(null);

      const { data, errors } = await response.json();
      if (errors?.length || !Array.isArray(data?.days)) {
        console.error(
          "Invalid subgraph response for /protocol-day-data",
          errors
        );
        return res.status(502).json(null);
      }

      const days = data.days;
      for (const day of days) {
        const dateS = Number(day.date);
        dayData.push({
          dateS,
          inflation: Number(day.inflation),
          participationRate: Number(day.participationRate),
          delegatorsCount: Number(day.delegatorsCount),
          activeTranscoderCount: Number(day.activeTranscoderCount),
          volumeUsd: Math.max(
            0,
            Number(day.volumeUSD) - (anomalousUsdByDay.get(dateS) ?? 0)
          ),
        });
      }

      if (days.length < PAGE_SIZE) break;
      lastDate = Number(days[days.length - 1].date);

      if (page === MAX_PAGES - 1) {
        console.warn(
          `/protocol-day-data hit MAX_PAGES (${MAX_PAGES}); series may be truncated`
        );
      }
    }

    if (dayData.length === 0) return res.status(502).json(null);

    // Bucket days into weeks for the fees "W" view. A new week-of-year number
    // starts a new bucket (mirrors the off-chain /usage aggregation).
    const weeklyData: ProtocolWeek[] = [];
    let currentWeek = -1;
    for (const day of dayData) {
      const week = dayjs.utc(dayjs.unix(day.dateS)).week();
      if (week !== currentWeek) {
        currentWeek = week;
        weeklyData.push({ date: day.dateS, weeklyVolumeUsd: 0 });
      }
      weeklyData[weeklyData.length - 1].weeklyVolumeUsd += day.volumeUsd;
    }

    const current = dayData[dayData.length - 1];
    const previous = dayData[dayData.length - 2];

    const change = (key: keyof ProtocolDay) =>
      getPercentChange(current?.[key] ?? 0, previous?.[key] ?? 0);

    // The last week bucket is in-progress, so headline fees use the last
    // complete week (second-to-last) and compare it to the week before that.
    const lastCompleteWeek = weeklyData[weeklyData.length - 2];
    const priorWeek = weeklyData[weeklyData.length - 3];

    const data: ProtocolDayData = {
      dayData,
      weeklyData,
      inflation: current?.inflation ?? 0,
      inflationChange: change("inflation"),
      participationRate: current?.participationRate ?? 0,
      participationRateChange: change("participationRate"),
      delegatorsCount: current?.delegatorsCount ?? 0,
      delegatorsCountChange: change("delegatorsCount"),
      activeTranscoderCount: current?.activeTranscoderCount ?? 0,
      activeTranscoderCountChange: change("activeTranscoderCount"),
      oneDayVolumeUSD: current?.volumeUsd ?? 0,
      volumeChangeUSD: change("volumeUsd"),
      oneWeekVolumeUSD: lastCompleteWeek?.weeklyVolumeUsd ?? 0,
      weeklyVolumeChangeUSD: getPercentChange(
        lastCompleteWeek?.weeklyVolumeUsd ?? 0,
        priorWeek?.weeklyVolumeUsd ?? 0
      ),
    };

    res.setHeader("Cache-Control", getCacheControlHeader("day"));

    return res.status(200).json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json(null);
  }
};

export default protocolDayDataHandler;
