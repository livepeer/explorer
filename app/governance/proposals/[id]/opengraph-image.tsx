import { shareCard } from "@/lib/og/card";
import { proposalShare } from "@/lib/og/data";

export const alt = "Treasury proposal on Livepeer Explorer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const share = await proposalShare(id).catch(() => null);
  return shareCard(
    share?.card ?? {
      eyebrow: "Treasury proposal",
      title: "Livepeer Explorer",
      stats: [],
    }
  );
}
