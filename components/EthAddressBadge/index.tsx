import { Badge } from "@livepeer/design-system";
import { useEnsData } from "hooks";
import Link from "next/link";

interface EthAddressBadgeProps {
  value: string | undefined;
}

const EthAddressBadge = ({ value }: EthAddressBadgeProps) => {
  const ensName = useEnsData(value);

  return (
    <Link passHref href={`/accounts/${value}/delegating`}>
      <Badge css={{ cursor: "pointer" }} variant="primary" size="1">
        {ensName?.name ? ensName?.name : ensName?.idShort ?? ""}
      </Badge>
    </Link>
  );
};

export default EthAddressBadge;
