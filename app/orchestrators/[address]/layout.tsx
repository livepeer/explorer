import type { Metadata } from "next";

import { orchestratorShare } from "@/lib/og/data";
import { shareMetadata } from "@/lib/og/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ address: string }>;
}): Promise<Metadata> {
  const { address } = await params;
  return shareMetadata(await orchestratorShare(address).catch(() => null));
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
