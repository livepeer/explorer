import { Box } from "@livepeer/design-system";
import type { ComponentProps } from "react";

interface FilterIconProps {
  size?: number;
  css?: ComponentProps<typeof Box>["css"];
}

const FilterIcon = ({ size = 16, css }: FilterIconProps) => (
  <Box
    as="svg"
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    css={css}
    aria-hidden="true"
  >
    <path
      d="M2 4h12M4 8h8M6 12h4"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </Box>
);

export default FilterIcon;
