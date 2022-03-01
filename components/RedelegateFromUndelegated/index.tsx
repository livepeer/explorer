import { useContext } from "react";
import { useWeb3React } from "@web3-react/core";
import { MutationsContext } from "../../contexts";
import { useApolloClient } from "@apollo/client";
import { initTransaction } from "@lib/utils";
import { Button } from "@livepeer/design-system";

const Index = ({ unbondingLockId, delegate, newPosPrev, newPosNext }) => {
  const context = useWeb3React();
  const client = useApolloClient();
  const { rebondFromUnbonded }: any = useContext(MutationsContext);

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
            await rebondFromUnbonded({
              variables: {
                unbondingLockId,
                delegate,
                newPosPrev,
                newPosNext,
              },
            });
          });
        }}
        css={{ mr: "$3" }}
      >
        Redelegate
      </Button>
    </>
  );
};

export default Index;
