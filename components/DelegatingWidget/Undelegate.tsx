import { Button } from "@livepeer/design-system";

import { parseEther } from "ethers/lib/utils";
import {
  useAccountAddress,
  useHandleTransaction,
  useLivepeerContracts,
} from "hooks";

const Undelegate = ({ amount, newPosPrev, newPosNext, disabled }) => {
  const accountAddress = useAccountAddress();

  const { bondingManager } = useLivepeerContracts();
  const handleTransaction = useHandleTransaction("bond");

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
        onClick={async () => {
          const args = {
            amount: parseEther(amount ? amount.toString() : "0"),
            newPosPrev,
            newPosNext,
          };

          await handleTransaction(
            () =>
              bondingManager.unbondWithHint(
                args.amount,
                newPosPrev,
                newPosNext
              ),
            args
          );
        }}
      >
        {!amount ? "Enter an amount" : "Undelegate"}
      </Button>
    </>
  );
};

export default Undelegate;
