import { useContext } from "react";
import { useWeb3React } from "@web3-react/core";
import { MutationsContext } from "core/contexts";
import { useApolloClient } from "@apollo/client";
import { initTransaction } from "@lib/utils";
import { Button } from "@livepeer/design-system";

const Index = ({ unbondingLockId }) => {
  const context = useWeb3React();
  const client = useApolloClient();
  const { withdrawStake }: any = useContext(MutationsContext);

  if (!context.active) {
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
