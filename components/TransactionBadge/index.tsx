import { formatTransactionHash } from "@lib/utils";
import { Badge, Box } from "@livepeer/design-system";
import { ArrowTopRightIcon } from "@modulz/radix-icons";

interface TransactionBadgeProps {
  id: string | undefined;
}

const TransactionBadge = ({ id }: TransactionBadgeProps) => {
  return (
    <Badge
      as="span"
      onClick={(e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        window.open(
          id ? `https://arbiscan.io/tx/${id}` : "https://arbiscan.io",
          "_blank",
          "noopener,noreferrer"
        );
      }}
      css={{
        cursor: "pointer",
        backgroundColor: "$neutral3",
        color: "$neutral11",
        border: "1px solid $neutral4",
        transition:
          "background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease",
        "&:hover": {
          border: "1.5px solid $grass7 !important",
          backgroundColor: "$grass3 !important",
          color: "$grass11 !important",
        },
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
  );
};

export default TransactionBadge;
