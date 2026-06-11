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
const MAX_PAGES = 50; // Safety bound to prevent infinite loop on malformed data.

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

      if (page === MAX_PAGES - 1) {
        console.warn(
          `/protocol-day-data hit MAX_PAGES (${MAX_PAGES}); series may be truncated`
        );
      }
    }

    if (dayData.length === 0) return res.status(502).json(null);

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
