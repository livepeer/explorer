import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Our custom type scale (`text-ui-body`, `text-page-title`, …) must count as
// font sizes, or tailwind-merge mistakes them for colours and drops them when
// a `text-<colour>` class follows.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "ui-caption",
            "ui-body",
            "page-title",
            "display-sm",
            "display-md",
          ],
        },
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
