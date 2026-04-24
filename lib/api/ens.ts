import { l1Provider } from "@lib/chains";
import { formatAddress } from "@lib/utils";
import sanitizeHtml from "sanitize-html";

import {
  GithubHandleSchema,
  TwitterHandleSchema,
  WebUrlSchema,
} from "./schemas/common";
import { EnsAvatarProviderSchema, EnsTextRecordSchema } from "./schemas/ens";
import { EnsIdentity } from "./types/get-ens";

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

export const getEnsForAddress = async (address: string | null | undefined) => {
  const idShort = address?.replace(address?.slice(6, 38), "…");

  const name = address ? await l1Provider.lookupAddress(address) : null;

  if (name) {
    const resolver = await l1Provider.getResolver(name);
    const [descriptionRaw, urlRaw, twitterRaw, githubRaw, avatarRaw] =
      await Promise.all([
        resolver?.getText("description"),
        resolver?.getText("url"),
        resolver?.getText("com.twitter"),
        resolver?.getText("com.github"),
        resolver?.getAvatar(),
      ]);

    // Validate all ENS provider responses with graceful fallback
    // If validation fails, we set the field to null rather than crashing
    const descriptionValidation = EnsTextRecordSchema.safeParse(descriptionRaw);
    const urlValidation = WebUrlSchema.nullable().safeParse(urlRaw);
    const twitterValidation =
      TwitterHandleSchema.nullable().safeParse(twitterRaw);
    const githubValidation = GithubHandleSchema.nullable().safeParse(githubRaw);
    const avatarValidation = EnsAvatarProviderSchema.safeParse(avatarRaw);

    const description = descriptionValidation.success
      ? descriptionValidation.data
      : null;
    const url = urlValidation.success ? urlValidation.data : null;
    const twitter = twitterValidation.success ? twitterValidation.data : null;
    const github = githubValidation.success ? githubValidation.data : null;
    const avatar = avatarValidation.success ? avatarValidation.data : null;

    const ens: EnsIdentity = {
      id: address ?? "",
      idShort: idShort ?? "",
      name: name ?? null,
      description: sanitizeHtml(nl2br(description), sanitizeOptions),
      url,
      twitter,
      github,
      avatar: avatar?.url ? `/api/ens-data/image/${name}` : null,
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

  const name = address ? await l1Provider.lookupAddress(address) : null;

  return {
    id: address ?? "",
    idShort: idShort ?? "",
    name,
  };
};
