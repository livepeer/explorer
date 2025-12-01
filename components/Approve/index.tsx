import { livepeerToken } from "@lib/api/abis/main/LivepeerToken";
import { useHandleTransaction } from "hooks";
import {
  useBondingManagerAddress,
  useLivepeerTokenAddress,
} from "hooks/useContracts";
import { useSimulateContract, useWriteContract } from "wagmi";

import { MAXIMUM_VALUE_UINT256 } from "../../lib/utils";
import Button from "../Button";

const Index = () => {
  const { data: livepeerTokenAddress } = useLivepeerTokenAddress();
  const { data: bondingManagerAddress } = useBondingManagerAddress();

  const { data: config } = useSimulateContract({
    query: { enabled: Boolean(livepeerTokenAddress && bondingManagerAddress) },
    address: livepeerTokenAddress,
    abi: livepeerToken,
    functionName: "approve",
    args: [bondingManagerAddress ?? "0x", BigInt(MAXIMUM_VALUE_UINT256)],
  });
  const { data, isPending, isSuccess, writeContract, error } =
    useWriteContract();

  useHandleTransaction("approve", data, error, isPending, isSuccess, {
    type: "approve",
    amount: BigInt(MAXIMUM_VALUE_UINT256),
  });

  return (
    <Button
      color="primary"
      disabled={!config}
      onClick={() => config && writeContract(config.request)}
    >
      Approve
    </Button>
  );
};

export default Index;
