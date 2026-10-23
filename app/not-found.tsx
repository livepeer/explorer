import Link from "next/link";

import { Page } from "@/components/page";

export default function NotFound() {
  return (
    <Page className="flex min-h-[70vh] flex-col items-start justify-center gap-4">
      <span className="font-mono text-ui-caption text-muted-foreground">
        404
      </span>
      <h1 className="text-display-sm font-light tracking-[-0.02em]">
        Nothing staked here.
      </h1>
      <p className="max-w-[46ch] text-ui-body text-muted-foreground">
        That page doesn&apos;t exist. Check the address, or search for an
        orchestrator or account with ⌘K.
      </p>
      <Link
        href="/"
        className="btn-primary mt-2 inline-flex h-9 items-center rounded-sm px-3.5 text-sm font-medium"
      >
        Back to portfolio
      </Link>
    </Page>
  );
}
