import { EnsIdentity } from "@api/types/get-ens";
import { l1Provider } from "@lib/chains";
import { NextApiRequest, NextApiResponse } from "next";

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse<EnsIdentity | null>
) => {
  try {
    const method = req.method;

    if (method === "GET") {
      const { id } = req.query;

      res.setHeader(
        "Cache-Control",
        "public, s-maxage=3600, stale-while-revalidate=5000"
      );

      if (typeof id === "string" && id.length === 42) {
        const idShort = id.replace(id.slice(6, 38), "…");

        const name = await l1Provider.lookupAddress(id);

        if (name) {
          const resolver = await l1Provider.getResolver(name);
          const [description, url, twitter, avatar] = await Promise.all([
            resolver.getText("description"),
            resolver.getText("url"),
            resolver.getText("com.twitter"),
            resolver.getAvatar(),
          ]);

          const ens: EnsIdentity = {
            id,
            idShort,
            name: name ?? null,
            description,
            url,
            twitter,
            avatar: avatar?.url
              ? avatar.url
              : null // `https://metadata.ens.domains/mainnet/avatar/${name}`,
          };

          return res.status(200).json(ens);
        }

        const ens: EnsIdentity = {
          id,
          idShort,
          name: null,
        };

        return res.status(200).json(ens);
      } else {
        return res.status(500).end("Invalid ID");
      }
    }

    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${method} Not Allowed`);
  } catch (err) {
    console.error(err);
    return res.status(500).json(null);
  }
};

export default handler;
