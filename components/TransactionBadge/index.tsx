import { Badge, Box, Link as A } from "@livepeer/design-system";
import { ArrowTopRightIcon } from "@modulz/radix-icons";
import { formatTransactionHash } from "@utils/web3";

interface TransactionBadgeProps {
  id: string | undefined;
}

const TransactionBadge = ({ id }: TransactionBadgeProps) => {
  return (
    <A
      target="_blank"
      rel="noopener noreferrer"
      variant="primary"
      href={id ? `https://arbiscan.io/tx/${id}` : "https://arbiscan.io"}
      css={{
        display: "inline-flex",
        textDecoration: "none !important",
        "&:hover > *": {
          border: "1.5px solid $grass7 !important",
          backgroundColor: "$grass3 !important",
          color: "$grass11 !important",
        },
      }}
    >
      <Badge
        css={{
          cursor: "pointer",
          backgroundColor: "$neutral3",
          color: "$neutral11",
          border: "1px solid $neutral4",
          transition:
            "background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease",
        }}
        size="1"
      >
        {formatTransactionHash(id)}
        <Box
          className="arrow-icon"
          css={{
            marginLeft: "$1",
            width: 14,
            height: 14,
          }}
          as={ArrowTopRightIcon}
        />
      </Badge>
    </A>
  );
};

export default TransactionBadge;
