import { poll } from "@lib/api/abis/main/Poll";
import { Button } from "@livepeer/design-system";
import { useAccountAddress, useHandleTransaction } from "hooks";
import { useContractWrite, usePrepareContractWrite } from "wagmi";

const Index = ({ pollAddress, choiceId, children, ...props }) => {
  const accountAddress = useAccountAddress();

  const { config } = usePrepareContractWrite({
    address: pollAddress,
    abi: poll,
    functionName: "vote",
    args: [choiceId],
  });
  const { data, isLoading, write, error, isSuccess } = useContractWrite(config);

  useHandleTransaction("vote", data, error, isLoading, isSuccess, { choiceId });

  if (!accountAddress) {
    return null;
  }

  return (
    <Button onClick={write} {...props}>
      {children}
    </Button>
  );
};

export default Index;
