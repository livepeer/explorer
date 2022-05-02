import { useContext } from "react";

import { MutationsContext } from "../../contexts";
import { useApolloClient } from "@apollo/client";
import { initTransaction } from "@lib/utils";
import { Button } from "@livepeer/design-system";
import { useAccountAddress } from "hooks";

const Index = ({ unbondingLockId, delegate, newPosPrev, newPosNext }) => {
  const accountAddress = useAccountAddress();
  const client = useApolloClient();
  const { rebondFromUnbonded }: any = useContext(MutationsContext);

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
