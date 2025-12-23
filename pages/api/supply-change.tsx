import { getCacheControlHeader } from "@lib/api";
import type { SupplyChangeData } from "@lib/api/types/get-supply-change";
import { CHAIN_INFO, DEFAULT_CHAIN_ID } from "@lib/chains";
import { fetchWithRetry } from "@lib/fetchWithRetry";
import type { NextApiRequest, NextApiResponse } from "next";

const SECONDS_PER_DAY = 24 * 60 * 60;

const supplyChangeHandler = async (
  _req: NextApiRequest,
  res: NextApiResponse<SupplyChangeData | null>
) => {
  const rangeStartDate = Math.floor(Date.now() / 1000) - 365 * SECONDS_PER_DAY;

  res.setHeader("Cache-Control", getCacheControlHeader("day"));

  const response = await fetchWithRetry(
    CHAIN_INFO[DEFAULT_CHAIN_ID].subgraph,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `
          query SupplyChange($rangeStartDate: Int!) {
            start: days(
              first: 1
              orderBy: date
              orderDirection: asc
              where: { date_gte: $rangeStartDate }
            ) {
              date
              totalSupply
            }
            end: days(
              first: 1
              orderBy: date
              orderDirection: desc
              where: { date_gte: $rangeStartDate }
            ) {
              date
              totalSupply
            }
          }
        `,
        variables: {
          rangeStartDate,
        },
      }),
    },
    {
      retryOnMethods: ["POST"],
    }
  );

  if (!response.ok) {
    return res.status(500).json(null);
  }

  const { data } = await response.json();
  const start = Array.isArray(data?.start) ? data.start : [];
  const end = Array.isArray(data?.end) ? data.end : [];

  const startItem = start[0];
  const endItem = end[0];
  const startSupply = Number(startItem?.totalSupply ?? 0);
  const endSupply = Number(endItem?.totalSupply ?? 0);
  const supplyChange =
    startSupply > 0 && endSupply > 0
      ? (endSupply - startSupply) / startSupply
      : null;

  return res.status(200).json({
    startDate: Number(startItem?.date ?? 0),
    endDate: Number(endItem?.date ?? 0),
    startSupply,
    endSupply,
    supplyChange,
  });
};

export default supplyChangeHandler;
