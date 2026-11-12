import type { Metadata } from "next";

import { pollShare } from "@/lib/og/data";
import { shareMetadata } from "@/lib/og/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return shareMetadata(await pollShare(id).catch(() => null));
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
