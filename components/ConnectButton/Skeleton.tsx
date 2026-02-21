import { Skeleton } from "@livepeer/design-system";

const ConnectButtonSkeleton = () => (
  <Skeleton
    css={{
      height: "40px",
      minWidth: "145px",
      width: "145px",
      borderRadius: "8px",
      display: "inline-block",
    }}
  />
);

export default ConnectButtonSkeleton;
