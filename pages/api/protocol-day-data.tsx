import { getCacheControlHeader } from "@lib/api";
import type {
  ProtocolDay,
  ProtocolDayData,
} from "@lib/api/types/get-protocol-day-data";
import { CHAIN_INFO, DEFAULT_CHAIN_ID } from "@lib/chains";
import { fetchWithRetry } from "@lib/fetchWithRetry";
import { getPercentChange } from "@lib/utils";
import type { NextApiRequest, NextApiResponse } from "next";

const PAGE_SIZE = 1000;
const MAX_PAGES = 50; // Safety bound to avoid infinite loops on malformed data.

const DAYS_QUERY = `
  query ProtocolDays($first: Int!, $lastDate: Int!) {
    days(
      first: $first
      orderBy: date
      orderDirection: asc
      where: { date_gt: $lastDate, inflation_gt: 0 }
    ) {
      date
      inflation
      participationRate
      delegatorsCount
      activeTranscoderCount
    }
  }
`;

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

      if (!response.ok) {
        return res.status(500).json(null);
      }

      const { data } = await response.json();
      const days = Array.isArray(data?.days) ? data.days : [];

      for (const day of days) {
        dayData.push({
          dateS: Number(day.date),
          inflation: Number(day.inflation),
          participationRate: Number(day.participationRate),
          delegatorsCount: Number(day.delegatorsCount),
          activeTranscoderCount: Number(day.activeTranscoderCount),
        });
      }

      if (days.length < PAGE_SIZE) break;
      lastDate = Number(days[days.length - 1].date);
    }

    const current = dayData[dayData.length - 1];
    const previous = dayData[dayData.length - 2];

    const change = (key: keyof ProtocolDay) =>
      getPercentChange(current?.[key] ?? 0, previous?.[key] ?? 0);

    const data: ProtocolDayData = {
      dayData,
      inflation: current?.inflation ?? 0,
      inflationChange: change("inflation"),
      participationRate: current?.participationRate ?? 0,
      participationRateChange: change("participationRate"),
      delegatorsCount: current?.delegatorsCount ?? 0,
      delegatorsCountChange: change("delegatorsCount"),
      activeTranscoderCount: current?.activeTranscoderCount ?? 0,
      activeTranscoderCountChange: change("activeTranscoderCount"),
    };

    res.setHeader("Cache-Control", getCacheControlHeader("day"));

    return res.status(200).json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json(null);
  }
};

export default protocolDayDataHandler;
