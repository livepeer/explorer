import type { NextApiRequest, NextApiResponse } from "next";

const totalTokenSupply = async (_req: NextApiRequest, res: NextApiResponse) => {
  const response = await fetch(
    `https://api.thegraph.com/subgraphs/name/livepeer/arbitrum-one`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `
          query {
            protocol(id: "0") {
              totalSupply
            }
          }
      `,
      }),
    }
  );

  res.setHeader(
    "Cache-Control",
    "public, s-maxage=3600, stale-while-revalidate=5000"
  );
  
  const {
    data: { protocol },
  } = await response.json();
  res.json(protocol.totalSupply);
};

export default totalTokenSupply;