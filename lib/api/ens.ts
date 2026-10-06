import { l1PublicClient } from "@lib/chains";
import { ensDescriptionSchema, sanitizeHtml } from "@lib/sanitize";
import { formatAddress } from "@utils/web3";
import { isAddress } from "viem";
import { normalize } from "viem/ens";

import { EnsIdentity } from "./types/get-ens";

export const getEnsForAddress = async (address: string | null | undefined) => {
  const idShort = address?.replace(address?.slice(6, 38), "…");

  const name =
    address && isAddress(address)
      ? await l1PublicClient.getEnsName({ address })
      : null;

  if (name) {
    const normalizedName = normalize(name);
    const [description, url, twitter, github, avatar] = await Promise.all([
      l1PublicClient.getEnsText({ name: normalizedName, key: "description" }),
      l1PublicClient.getEnsText({ name: normalizedName, key: "url" }),
      l1PublicClient.getEnsText({ name: normalizedName, key: "com.twitter" }),
      l1PublicClient.getEnsText({ name: normalizedName, key: "com.github" }),
      l1PublicClient.getEnsText({ name: normalizedName, key: "avatar" }),
    ]);

    const ens: EnsIdentity = {
      id: address ?? "",
      idShort: idShort ?? "",
      name: name ?? null,
      description: sanitizeHtml(nl2br(description), ensDescriptionSchema),
      url,
      twitter,
      github,
      avatar: avatar
        ? `/api/ens-data/image/${encodeURIComponent(normalizedName)}`
        : null,
    };

    return ens;
  }

  const ens: EnsIdentity = {
    id: address ?? "",
    idShort: idShort ?? "",
    name: null,
  };

  return ens;
};

export const nl2br = (str, is_xhtml = true) => {
  if (typeof str === "undefined" || str === null) {
    return "";
  }
  const breakTag =
    is_xhtml || typeof is_xhtml === "undefined" ? "<br />" : "<br>";
  return (str + "").replace(
    /([^>\r\n]?)(\r\n|\n\r|\r|\n)/g,
    "$1" + breakTag + "$2"
  );
};

export const getEnsForVotes = async (address: string | null | undefined) => {
  const idShort = formatAddress(address);

  const name =
    address && isAddress(address)
      ? await l1PublicClient.getEnsName({ address })
      : null;

  return {
    id: address ?? "",
    idShort: idShort ?? "",
    name,
  };
};
