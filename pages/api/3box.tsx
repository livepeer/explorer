import type { NextApiRequest, NextApiResponse } from "next";

const ThreeBox = async (_req: NextApiRequest, res: NextApiResponse) => {
  const { account } = _req.query;
  const Box = require("3box");

  let useThreeBox = false;
  const profile = await Box.getProfile(account.toString());
  const space = await Box.getSpace(
    account.toString().toLowerCase(),
    "livepeer"
  );

  if (space.defaultProfile === "3box") {
    useThreeBox = true;
  }

  res.json({
    id: account,
    name: useThreeBox ? profile?.name : space?.name,
    website: useThreeBox ? profile?.website : space?.website,
    description: useThreeBox ? profile?.description : space?.description,
    image: useThreeBox
      ? profile?.image?.length
        ? profile?.image[0].contentUrl["/"]
        : ""
      : space?.image,
  });
};

export default ThreeBox;
