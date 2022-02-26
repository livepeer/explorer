import { useContext } from "react";
import Button from "../Button";
import { MAXIUMUM_VALUE_UINT256, initTransaction } from "../../lib/utils";
import { MutationsContext } from "../../contexts";
import { useApolloClient } from "@apollo/client";
import { useWeb3React } from "@web3-react/core";

const Index = () => {
  const client = useApolloClient();
  const context = useWeb3React();
  const { approve }: any = useContext(MutationsContext);

  const onClick = () => {
    initTransaction(client, async () => {
      try {
        await approve({
          variables: {
            type: "bond",
            amount: MAXIUMUM_VALUE_UINT256,
          },
          context: {
            signer: context.library.getSigner(),
          },
        });
      } catch (e) {
        console.log(e);
      }
    });
  };

  return (
    <Button color="primary" onClick={onClick}>
      Approve
    </Button>
  );
};

export default Index;
