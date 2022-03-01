import { useContext } from "react";
import Utils from "web3-utils";
import { Button } from "@livepeer/design-system";
import { useWeb3React } from "@web3-react/core";
import { MutationsContext } from "../../contexts";
import { useApolloClient } from "@apollo/client";
import { initTransaction } from "../../lib/utils";

const Undelegate = ({
  amount,
  newPosPrev,
  newPosNext,
  delegator,
  disabled,
}) => {
  const context = useWeb3React();
  const client = useApolloClient();
  const { unbond }: any = useContext(MutationsContext);

  if (!context.active) {
    return null;
  }

  return (
    <>
      <Button
        size="4"
        variant="red"
        disabled={disabled}
        css={{
          width: "100%",
        }}
        onClick={() => {
          initTransaction(client, async () => {
            try {
              await unbond({
                variables: {
                  amount: Utils.toWei(amount ? amount.toString() : "0"),
                  newPosPrev,
                  newPosNext,
                },
              });
            } catch (err) {
              console.log(err);
            }
          });
        }}
      >
        {!amount ? "Enter an amount" : "Undelegate"}
      </Button>
    </>
  );
};

export default Undelegate;
