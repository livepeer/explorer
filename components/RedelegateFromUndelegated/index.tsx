import { bondingManager } from "@lib/api/abis/main/BondingManager";
import { Box, Button, Flex } from "@livepeer/design-system";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { useAccountAddress } from "hooks";
import { useBondingManagerAddress } from "hooks/useContracts";
import { useDelegationReview } from "hooks/useDelegationReview";
import { useHandleTransaction } from "hooks/useHandleTransaction";
import { useSimulateContract, useWriteContract } from "wagmi";

import { ExplorerTooltip } from "../ExplorerTooltip";

const Index = ({
  unbondingLockId,
  delegate,
  newPosPrev,
  newPosNext,
  delegator,
  currentRound,
}) => {
  const { delegationWarning } = useDelegationReview({
    delegator,
    currentRound,
    action: "redelegateFromUndelegated",
  });
  const accountAddress = useAccountAddress();

  const { data: bondingManagerAddress } = useBondingManagerAddress();

  const { data: config } = useSimulateContract({
    address: bondingManagerAddress,
    abi: bondingManager,
    functionName: "rebondFromUnbondedWithHint",
    args: [delegate, unbondingLockId, newPosPrev, newPosNext],
  });
  const { data, isPending, writeContract, error, isSuccess } =
    useWriteContract();

  useHandleTransaction(
    "rebondFromUnbonded",
    data,
    error,
    isPending,
    isSuccess,
    {
      delegate,
      unbondingLockId,
      newPosPrev,
      newPosNext,
    }
  );

  if (!accountAddress) {
    return null;
  }

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
      {delegationWarning && (
        <ExplorerTooltip content={delegationWarning} multiline>
          <Box
            css={{
              display: "inline-flex",
              color: "$yellow11",
              cursor: "help",
            }}
          >
            <ExclamationTriangleIcon width={18} height={18} />
          </Box>
        </ExplorerTooltip>
      )}
    </Flex>
  );
};

export default Index;
