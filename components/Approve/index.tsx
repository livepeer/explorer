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

  const { data: simulateData } = useSimulateContract({
    address: livepeerTokenAddress ?? "0x",
    abi: livepeerToken,
    functionName: "approve",
    args: [bondingManagerAddress ?? "0x", BigInt(MAXIMUM_VALUE_UINT256)],
  });

  const { writeContract, data: writeData, isPending, isSuccess, error } = useWriteContract();

  useHandleTransaction("approve", writeData ? { hash: writeData } : undefined, error, isPending, isSuccess, {
    type: "approve",
    amount: MAXIMUM_VALUE_UINT256,
  });

  return (
    <Button
      color="primary"
      disabled={!livepeerTokenAddress || !bondingManagerAddress}
      onClick={() => simulateData && writeContract({...simulateData.request})}
    >
      Approve
    </Button>
  );
};

export default Index;
