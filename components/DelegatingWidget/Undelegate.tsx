import { useContext } from "react";
import Utils from "web3-utils";
import { Button } from "@livepeer/design-system";

import { MutationsContext } from "../../contexts";
import { useApolloClient } from "@apollo/client";
import { initTransaction } from "../../lib/utils";
import { useAccountAddress } from "hooks";

const Undelegate = ({
  amount,
  newPosPrev,
  newPosNext,
  delegator,
  disabled,
}) => {
  const accountAddress = useAccountAddress();
  const client = useApolloClient();
  const { unbond }: any = useContext(MutationsContext);

  if (!accountAddress) {
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
