import { Badge } from "@livepeer/design-system";
import { useEnsData } from "hooks";
import Link from "next/link";

interface EthAddressBadgeProps {
  value: string | undefined;
}

const EthAddressBadge = ({ value }: EthAddressBadgeProps) => {
  const ensName = useEnsData(value);
  const displayName = ensName?.name || ensName?.idShort || "";

  return (
    <Link passHref href={`/accounts/${value}/delegating`} title={displayName}>
      <Badge
        css={{
          cursor: "pointer",
          display: "inline-block",
          maxWidth: 240,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          verticalAlign: "bottom",
        }}
        variant="primary"
        size="1"
      >
        {displayName}
      </Badge>
    </Link>
  );
};

export default EthAddressBadge;
