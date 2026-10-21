import { cpSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Next serves only `public/`. Copy the review HTML (and shared fonts) so a
// Vercel preview can open /design/mocks/<slug>/ without a second source tree.
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(root, "design", "mocks");
const destination = join(root, "public", "design", "mocks");

rmSync(destination, { recursive: true, force: true });
cpSync(source, destination, { recursive: true });
