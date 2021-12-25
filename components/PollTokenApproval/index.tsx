import { MAXIUMUM_VALUE_UINT256, initTransaction } from "../../lib/utils";
import { useContext } from "react";
import { MutationsContext } from "core/contexts";
import { useApolloClient } from "@apollo/client";
import { Button } from "@livepeer/design-system";

const Index = () => {
  const client = useApolloClient();
  const { approve }: any = useContext(MutationsContext);

  return (
    <>
      <Button
        variant="blue"
        size="3"
        onClick={() => {
          initTransaction(client, async () => {
            await approve({
              variables: { type: "createPoll", amount: MAXIUMUM_VALUE_UINT256 },
            });
          });
        }}
      >
        Approve LPT for poll creation
      </Button>
    </>
  );
};

export default Index;
