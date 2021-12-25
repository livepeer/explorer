import { useContext } from "react";
import { useWeb3React } from "@web3-react/core";
import { MutationsContext } from "core/contexts";
import { useApolloClient } from "@apollo/client";
import { initTransaction } from "@lib/utils";
import { Button } from "@livepeer/design-system";

const Index = ({
  unbondingLockId,
  delegate,
  newPosPrev,
  newPosNext,
  delegator,
}) => {
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
                delegator: delegator?.id,
                lastClaimRound: parseInt(delegator?.lastClaimRound.id, 10),
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
