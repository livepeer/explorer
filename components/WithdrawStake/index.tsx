import { useContext } from "react";

import { MutationsContext } from "../../contexts";
import { useApolloClient } from "@apollo/client";
import { initTransaction } from "@lib/utils";
import { Button } from "@livepeer/design-system";
import { useAccountAddress } from "hooks";

const Index = ({ unbondingLockId }) => {
  const accountAddress = useAccountAddress();
  const client = useApolloClient();
  const { withdrawStake }: any = useContext(MutationsContext);

  if (!accountAddress) {
    return null;
  }

  return (
    <>
      <Button
        variant="primary"
        size="3"
        onClick={() => {
          initTransaction(client, async () => {
            await withdrawStake({
              variables: {
                unbondingLockId,
              },
            });
          });
        }}
        css={{ py: "$2", mr: "$3" }}
      >
        Withdraw
      </Button>
    </>
  );
};

export default Index;
