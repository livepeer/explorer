import { ExplorerTooltip } from "@components/ExplorerTooltip";
import { Box } from "@livepeer/design-system";
import { formatFullLPT } from "@utils/lpt";
import { formatLPT, FormatOptions } from "@utils/numberFormatters";

interface Props {
  value: string | number | null | undefined;
  options?: FormatOptions;
}

export default function LptValue({ value, options = {} }: Props) {
  if (formatFullLPT(value) == null) return <span>—</span>;

  const compact = formatLPT(value, options);
  const full = formatFullLPT(value, {
    forceSign: options.forceSign,
  });
  if (full == null || full === compact) return <span>{compact}</span>;

  return (
    <ExplorerTooltip
      content={full}
      style={{ maxWidth: "calc(100vw - 32px)", overflowWrap: "anywhere" }}
    >
      <Box
        as="button"
        type="button"
        css={{
          appearance: "none",
          background: "none",
          border: 0,
          padding: 0,
          font: "inherit",
          color: "inherit",
          textAlign: "inherit",
          cursor: "help",
          borderRadius: "$1",
          "&:focus-visible": {
            outline: "2px solid $primary9",
            outlineOffset: 2,
          },
        }}
      >
        {compact}
      </Box>
    </ExplorerTooltip>
  );
}
