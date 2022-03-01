import { useContext } from "react";
import { MutationsContext } from "../../contexts";
import { useApolloClient } from "@apollo/client";
import { initTransaction } from "../../lib/utils";
import { Button } from "@livepeer/design-system";

const Index = ({ unbondingLockId, newPosPrev, newPosNext }) => {
  const client = useApolloClient();
  const { rebond }: any = useContext(MutationsContext);

  return (
    <>
      <Button
        variant="primary"
        size="3"
        onClick={() => {
          initTransaction(client, async () => {
            await rebond({
              variables: {
                unbondingLockId,
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
