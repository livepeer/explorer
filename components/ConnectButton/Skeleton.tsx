import { Box } from "@livepeer/design-system";

const ConnectButtonSkeleton = () => (
  <Box
    css={{
      height: "40px",
      minWidth: "140px",
      width: "140px",
      borderRadius: "8px",
      backgroundColor: "$neutral4",
      display: "inline-block",
      animation: "pulse 1.5s ease-in-out infinite",
      "@keyframes pulse": {
        "0%, 100%": {
          opacity: 1,
        },
        "50%": {
          opacity: 0.6,
        },
      },
    }}
  />
);

export default ConnectButtonSkeleton;
