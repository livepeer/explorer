import { ExplorerTooltip } from "@components/ExplorerTooltip";
import { bondingManager } from "@lib/api/abis/main/BondingManager";
import { Box, Button, Flex } from "@livepeer/design-system";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { useBondingManagerAddress } from "hooks/useContracts";
import { useDelegationReview } from "hooks/useDelegationReview";
import { useHandleTransaction } from "hooks/useHandleTransaction";
import { useSimulateContract, useWriteContract } from "wagmi";

const Index = ({
  unbondingLockId,
  newPosPrev,
  newPosNext,
  delegator,
  currentRound,
}) => {
  const { delegationWarning } = useDelegationReview({
    delegator,
    currentRound,
    action: "redelegate",
  });
  const { data: bondingManagerAddress } = useBondingManagerAddress();

  const { data: config } = useSimulateContract({
    address: bondingManagerAddress,
    abi: bondingManager,
    functionName: "rebondWithHint",
    args: [unbondingLockId, newPosPrev, newPosNext],
  });
  const { data, isPending, writeContract, error, isSuccess } =
    useWriteContract();

  useHandleTransaction("rebond", data, error, isPending, isSuccess, {
    unbondingLockId,
    newPosPrev,
    newPosNext,
  });

  return (
    <Flex
      css={{
        gap: "$2",
        alignItems: "center",
        flexDirection: "row-reverse",
        "@bp2": {
          flexDirection: "row",
        },
      }}
    >
      {delegationWarning && (
        <ExplorerTooltip content={delegationWarning} multiline>
          <Box
            css={{
              display: "inline-flex",
              color: "$yellow11",
            }}
          >
            <ExclamationTriangleIcon width={18} height={18} />
          </Box>
        </ExplorerTooltip>
      )}
      <Button
        css={{
          "@bp2": {
            marginRight: "$3",
          },
        }}
        disabled={!config}
        onClick={() => config && writeContract(config.request)}
        size="3"
        variant="primary"
      >
        Redelegate
      </Button>
    </Flex>
  );
};

export default Index;
