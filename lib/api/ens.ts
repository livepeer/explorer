import { cacheControlValues } from "@lib/api/api";
import { l1PublicClient } from "@lib/chains";
import { Redis } from "@upstash/redis";
import { formatAddress } from "@utils/web3";
import { parseArweaveTxId, parseCid } from "livepeer/utils";
import sanitizeHtml from "sanitize-html";
import { isAddress } from "viem";
import { normalize } from "viem/ens";

import { EnsIdentity } from "./types/get-ens";

export const ENS_BLACKLISTED_ADDRESSES = [
  "0xcb69ffc06d3c218472c50ee25f5a1d3ca9650c44",
].map((a) => a.toLowerCase());

export const ENS_CACHE_TTL = "week";

const redis =
  typeof window === "undefined" &&
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
    : null;
  
if (!redis && typeof window === "undefined") {
  console.warn(
    "ENS cache: UPSTASH_REDIS_REST_URL/TOKEN not set, running without caching (every request will hit L1 directly)."
  );
}

const ENS_CACHE_TTL_SECONDS = cacheControlValues[ENS_CACHE_TTL].maxAge;
const ENS_LOCK_TTL_SECONDS = 20;

const sanitizeOptions: sanitizeHtml.IOptions = {
  allowedTags: [
    "b",
    "i",
    "em",
    "strong",
    "a",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "div",
    "hr",
    "li",
    "ol",
    "p",
    "pre",
    "ul",
    "br",
    "code",
    "span",
  ],
  disallowedTagsMode: "discard",
  allowedAttributes: {
    a: ["href"],
  },
  // Lots of these won't come up by default because we don't allow them
  selfClosing: [
    "img",
    "br",
    "hr",
    "area",
    "base",
    "basefont",
    "input",
    "link",
    "meta",
  ],
  // URL schemes we permit
  allowedSchemes: ["https", "mailto", "tel"],
  allowedSchemesByTag: {},
  allowedSchemesAppliedToAttributes: ["href", "src", "cite"],
  allowProtocolRelative: false,
  enforceHtmlBoundary: true,
};

export class LockBusyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LockBusyError";
  }
}

export const getAvatarUrlCached = async (
  address: string,
  name: string
): Promise<string | null> => {
  if (!redis) {
    return resolveAvatarUrl(name);
  }

  const key = `avatar-url:${address.toLowerCase()}`;

  try {
    const cached = await redis.get<string>(key);
    if (cached) {
      return cached;
    }
  } catch (err) {
    console.error("Avatar URL cache read failed:", err);
    return resolveAvatarUrl(name);
  }

  const imageUrl = await resolveAvatarUrl(name);

  if (!imageUrl) {
    return null;
  }

  try {
    await redis.set(key, imageUrl, { ex: ENS_CACHE_TTL_SECONDS });
  } catch (err) {
    console.error("Avatar URL cache write failed:", err);
    return imageUrl;
  }
  return imageUrl;
};

const resolveAvatarUrl = async (name: string): Promise<string | null> => {
  const avatar = await l1PublicClient.getEnsAvatar({ name: normalize(name) });

  const cid = parseCid(avatar);
  const arweaveId = parseArweaveTxId(avatar);

  const hasAvatarRecord = Boolean(avatar);

  const result = cid?.id
    ? `https://dweb.link/ipfs/${cid.id}`
    : arweaveId?.id
    ? arweaveId?.url
    : avatar?.startsWith("https://")
    ? avatar
    : hasAvatarRecord
    ? `https://metadata.ens.domains/mainnet/avatar/${name}`
    : null;

  return result;
};

export const getEnsForAddressCached = async (
  address: string | null | undefined
): Promise<EnsIdentity> => {
  const key = (address ?? "").toLowerCase();

  if (!redis) {
    const ens = await getEnsForAddress(address);
    return { ...ens, computedAt: Date.now() };
  }

  try {
    const cached = await redis.get<EnsIdentity>(key);

    if (cached) {
      return cached;
    }
  } catch (err) {
    console.error("ENS cache read failed:", err);
    const ens = await getEnsForAddress(address);
    const stampedEns = { ...ens, computedAt: Date.now() };
    return stampedEns;
  }

  const lockKey = `lock:${key}`;
  let lockAcquired = true;

  try {
    const lockResult = await redis.set(lockKey, "1", {
      nx: true,
      ex: ENS_LOCK_TTL_SECONDS,
    });
    lockAcquired = lockResult !== null;
  } catch (err) {
    console.error("ENS lock acquisition failed, proceeding unlocked:", err);
    lockAcquired = true;
  }

  if (!lockAcquired) {
    throw new LockBusyError(
      "Another request is already resolving this address"
    );
  }

  const ens = await getEnsForAddress(address);
  const stampedEns = { ...ens, computedAt: Date.now() };

  try {
    await redis.set(key, stampedEns, { ex: ENS_CACHE_TTL_SECONDS });
  } catch (err) {
    console.error("ENS cache write failed:", err);
    return stampedEns;
  } finally {
    try {
      await redis.del(lockKey);
    } catch (err) {
      console.error("ENS lock release failed:", err);
    }
  }
  return stampedEns;
};

export const getEnsForAddress = async (address: string | null | undefined) => {
  if (!address) {
    return {
      id: "",
      idShort: "",
      name: null,
    } as EnsIdentity;
  }

  const idShort = address.replace(address.slice(6, 38), "…");

  const name = isAddress(address)
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
      id: address,
      idShort: idShort,
      name: name ?? null,
      description: sanitizeHtml(nl2br(description), sanitizeOptions),
      url,
      twitter,
      github,
      avatar: avatar
        ? `/api/ens-data/image/${encodeURIComponent(address)}`
        : null,
    };

    return ens;
  }

  const ens: EnsIdentity = {
    id: address,
    idShort: idShort,
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
