import { bondingManager } from "@lib/api/abis/main/BondingManager";
import { Button } from "@livepeer/design-system";
import { useBondingManagerAddress } from "hooks/useContracts";
import { useSimulateContract } from "wagmi";

const Index = ({ unbondingLockId, newPosPrev, newPosNext }) => {
  const { data: bondingManagerAddress } = useBondingManagerAddress();

  const { data: config } = useSimulateContract({
    address: bondingManagerAddress,
    abi: bondingManager,
    functionName: "rebondWithHint",
    args: [unbondingLockId, newPosPrev, newPosNext],
  });

  return (
    <>
      <Button
        css={{ marginRight: "$3" }}
        disabled={!config}
        // onClick={() => config && writeContract(config.request)}
        size="3"
        variant="primary"
      >
        Redelegate
      </Button>
    </>
  );
};

export default Index;
