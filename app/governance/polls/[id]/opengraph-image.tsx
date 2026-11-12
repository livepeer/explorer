import { shareImage } from "@/lib/og/card";
import { pollShare } from "@/lib/og/data";

export const alt = "LIP poll on Livepeer Explorer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const share = await pollShare(id).catch(() => null);
  return shareImage(share?.card, "LIP poll");
}
