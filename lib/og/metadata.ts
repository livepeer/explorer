import type { Metadata } from "next";

import type { Share } from "./data";

const SITE = "Livepeer Explorer";

/**
 * Page metadata from a share. Open Graph and X objects replace the root
 * layout's rather than merging, so they're restated in full; the image
 * itself comes from the segment's opengraph-image route.
 */
export function shareMetadata(share: Share | null): Metadata {
  if (!share) return {};
  const title = `${share.title} · ${SITE}`;
  return {
    title: share.title,
    description: share.description,
    openGraph: {
      title,
      description: share.description,
      siteName: SITE,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: share.description,
    },
  };
}
