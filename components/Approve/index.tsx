import { livepeerToken } from "@lib/api/abis/main/LivepeerToken";
import { useHandleTransaction } from "hooks";
import {
  useBondingManagerAddress,
  useLivepeerTokenAddress,
} from "hooks/useContracts";
import { useContractWrite, usePrepareContractWrite } from "wagmi";
import { MAXIMUM_VALUE_UINT256 } from "../../lib/utils";
import Button from "../Button";

const Index = () => {
  const { data: livepeerTokenAddress } = useLivepeerTokenAddress();
  const { data: bondingManagerAddress } = useBondingManagerAddress();

  const { config } = usePrepareContractWrite({
    enabled: Boolean(livepeerTokenAddress && bondingManagerAddress),
    address: livepeerTokenAddress,
    abi: livepeerToken,
    functionName: "approve",
    args: [bondingManagerAddress, BigInt(MAXIMUM_VALUE_UINT256)],
  });
  const { data, isLoading, isSuccess, write, error } = useContractWrite(config);

  useHandleTransaction("approve", data, error, isLoading, isSuccess, {
    type: "approve",
    amount: MAXIMUM_VALUE_UINT256,
  });

  return (
    <Button color="primary" onClick={write}>
      Approve
    </Button>
  );
};

export default Index;
