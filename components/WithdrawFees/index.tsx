import { useContext } from "react";
import { useWeb3React } from "@web3-react/core";
import { MutationsContext } from "core/contexts";
import { useApolloClient } from "@apollo/client";
import { initTransaction } from "../../lib/utils";
import { Button } from "@livepeer/design-system";

const Index = ({ delegator, children, ...props }) => {
  const context = useWeb3React();
  const client = useApolloClient();
  const { withdrawFees }: any = useContext(MutationsContext);

  if (!context.active) {
    return null;
  }
  return (
    <>
      <Button
        onClick={() => {
          initTransaction(client, async () => {
            await withdrawFees({
              variables: {
                delegator: delegator?.id,
                lastClaimRound: parseInt(delegator?.lastClaimRound.id, 10),
              },
            });
          });
        }}
        {...props}
      >
        {children}
      </Button>
    </>
  );
};

export default Index;
