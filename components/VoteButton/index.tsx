import { livepeerGovernor } from "@lib/api/abis/main/LivepeerGovernor";
import { poll } from "@lib/api/abis/main/Poll";
import { getLivepeerGovernorAddress } from "@lib/api/contracts";
import { Button } from "@livepeer/design-system";
import { useAccountAddress, useHandleTransaction } from "hooks";
import {
  Address,
  UsePrepareContractWriteConfig,
  useContractWrite,
  usePrepareContractWrite,
} from "wagmi";

type Props = React.ComponentProps<typeof Button> & {
  pollAddress?: Address;
  proposalId?: string;
  choiceId: number;
};

const livepeerGovernorAddress = getLivepeerGovernorAddress();

import { useMemo } from "react";

const Index = ({
  pollAddress,
  proposalId,
  choiceId,
  children,
  ...props
}: Props) => {
  const accountAddress = useAccountAddress();

  const preparedWriteConfig = useMemo<UsePrepareContractWriteConfig>(() => {
    if (!proposalId && !pollAddress) {
      return {
        enabled: false,
      };
    }

    if (proposalId) {
      return {
        enabled: Boolean(accountAddress),
        address: livepeerGovernorAddress,
        abi: livepeerGovernor,
        functionName: "castVote",
        args: [BigInt(proposalId), choiceId],
      };
    }
    return {
      enabled: Boolean(accountAddress),
      address: pollAddress,
      abi: poll,
      functionName: "vote",
      args: [BigInt(choiceId)],
    };
  }, [proposalId, pollAddress, choiceId, accountAddress]);

  const { config } = usePrepareContractWrite(preparedWriteConfig);
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
