import { useContext } from "react";
import Utils from "web3-utils";
import { Button } from "@livepeer/design-system";
import { useWeb3React } from "@web3-react/core";
import { MutationsContext } from "core/contexts";
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
        onClick={() => {
          initTransaction(client, async () => {
            try {
              await unbond({
                variables: {
                  amount: Utils.toWei(amount ? amount.toString() : "0"),
                  newPosPrev,
                  newPosNext,
                  delegator: delegator?.id,
                  lastClaimRound: parseInt(delegator?.lastClaimRound.id, 10),
                },
              });
            } catch (err) {
              console.log(err);
            }
          });
        }}
        css={{ width: "100%" }}
      >
        {!amount ? "Enter an amount" : "Undelegate"}
      </Button>
    </>
  );
};

export default Undelegate;
