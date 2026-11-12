"use client";

import { useEffect } from "react";

import { Page } from "@/components/page";
import { DISCORD_URL } from "@/lib/config";

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Page className="flex min-h-[70vh] flex-col items-start justify-center gap-4">
      <span className="text-ui-caption text-warm">Something broke</span>
      <h1 className="text-display-sm font-light tracking-[-0.02em]">
        This view hit an error.
      </h1>
      <p className="max-w-[52ch] text-ui-body text-muted-foreground">
        Your funds are unaffected — this is a display problem. Try again, and if
        it keeps happening let us know in the Livepeer Discord.
      </p>
      {error.digest && (
        <p className="font-mono text-ui-caption text-subtle-foreground">
          Reference {error.digest}
        </p>
      )}
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={reset}
          className="btn-primary inline-flex h-9 cursor-pointer items-center rounded-sm px-3.5 text-sm font-medium"
        >
          Try again
        </button>
        {/* Never an invite by hand: the old discord.gg/livepeer was taken
            over (#768). livepeer.org/discord redirects to the server's
            live invite (livepeer/website lib/discord.ts). */}
        <a
          href={DISCORD_URL}
          target="_blank"
          rel="noreferrer"
          className="btn-outline inline-flex h-9 items-center rounded-sm px-3.5 text-sm font-medium"
        >
          Discord
        </a>
      </div>
    </Page>
  );
}
