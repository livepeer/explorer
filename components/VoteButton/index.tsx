
import { useContext } from "react";
import { MutationsContext } from "../../contexts";
import { useApolloClient } from "@apollo/client";
import { initTransaction } from "../../lib/utils";
import { Button } from "@livepeer/design-system";
import { useAccountAddress } from "hooks";

const Index = ({ pollAddress, choiceId, children, ...props }) => {
  const accountAddress = useAccountAddress();
  const client = useApolloClient();
  const { vote }: any = useContext(MutationsContext);

  if (!accountAddress) {
    return null;
  }

  return (
    <Button
      onClick={() => {
        initTransaction(client, async () => {
          await vote({ variables: { pollAddress, choiceId } });
        });
      }}
      {...props}
    >
      {children}
    </Button>
  );
};

export default Index;
