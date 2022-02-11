import type { NextApiRequest, NextApiResponse } from "next";

const getLivepeerComUsageData = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  let endpoint = "https://livepeer.com/api/usage";

  const { fromTime, toTime } = req.query;

  if (fromTime && toTime) {
    endpoint = `https://livepeer.com/api/usage?fromTime=${fromTime}&toTime=${toTime}`;
  }

  const livepeerComUsageDataReponse = await fetch(endpoint, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${process.env.LIVEPEER_COM_API_ADMIN_TOKEN}`,
    },
  });

  const livepeerComUsageData = await livepeerComUsageDataReponse.json();

  // convert date format from milliseconds to seconds before merging
  const arr = livepeerComUsageData.map((day) => ({
    ...day,
    date: day.date / 1000,
  }));

  res.json(arr);
};

export default getLivepeerComUsageData;
