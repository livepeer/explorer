import { shareCard } from "@/lib/og/card";
import { orchestratorShare } from "@/lib/og/data";

export const alt = "Orchestrator on Livepeer Explorer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const { address } = await params;
  const share = await orchestratorShare(address).catch(() => null);
  return shareCard(
    share?.card ?? {
      eyebrow: "Orchestrator",
      title: "Livepeer Explorer",
      stats: [],
    }
  );
}
