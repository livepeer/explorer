import { MAXIUMUM_VALUE_UINT256, initTransaction } from "../../lib/utils";
import { useContext } from "react";
import { MutationsContext } from "../../contexts";
import { useApolloClient } from "@apollo/client";
import { Button } from "@livepeer/design-system";
import { useWeb3React } from "@web3-react/core";

const Index = () => {
  const client = useApolloClient();
  const context = useWeb3React();
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
              context: {
                signer: context.library.getSigner(),
              },
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
