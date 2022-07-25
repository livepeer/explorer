import { l1Provider } from "@lib/chains";
import { EnsIdentity } from "./types/get-ens";

export const getEnsForAddress = async (address: string | null | undefined) => {
  const idShort = address.replace(address.slice(6, 38), "…");

  const name = await l1Provider.lookupAddress(address);

  if (name) {
    const resolver = await l1Provider.getResolver(name);
    const [description, url, twitter, avatar] = await Promise.all([
      resolver.getText("description"),
      resolver.getText("url"),
      resolver.getText("com.twitter"),
      resolver.getAvatar(),
    ]);

    const ens: EnsIdentity = {
      id: address,
      idShort,
      name: name ?? null,
      description,
      url,
      twitter,
      avatar: avatar?.url ? `/api/ens-data/image/${name}` : null,
    };

    return ens;
  }

  const ens: EnsIdentity = {
    id: address,
    idShort,
    name: null,
  };

  return ens;
};
