import { l1PublicClient } from "@lib/chains";
import sanitizeHtml from "sanitize-html";
import { Address } from "viem";
import { normalize } from "viem/ens";

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

export const getEnsForAddress = async (address: Address | null | undefined) => {
  const idShort = address.replace(address.slice(6, 38), "…");

  const name = await l1PublicClient.getEnsName({ address });

  if (name) {
    const [description, url, twitter, avatar] = await Promise.all([
      l1PublicClient.getEnsText({
        name: normalize(name),
        key: "description",
      }),
      l1PublicClient.getEnsText({
        name: normalize(name),
        key: "url",
      }),
      l1PublicClient.getEnsText({
        name: normalize(name),
        key: "com.twitter",
      }),
      l1PublicClient.getEnsAvatar({
        name: normalize(name),
      }),
    ]);

    const ens: EnsIdentity = {
      id: address,
      idShort,
      name: normalize(name) ?? null,
      description: sanitizeHtml(nl2br(description), sanitizeOptions),
      url,
      twitter,
      avatar: avatar ? `/api/ens-data/image/${normalize(name)}` : null,
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

export const nl2br = (str, is_xhtml = true) => {
  if (typeof str === "undefined" || str === null) {
    return "";
  }
  var breakTag =
    is_xhtml || typeof is_xhtml === "undefined" ? "<br />" : "<br>";
  return (str + "").replace(
    /([^>\r\n]?)(\r\n|\n\r|\r|\n)/g,
    "$1" + breakTag + "$2"
  );
};
