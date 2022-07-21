
import { Button } from "@livepeer/design-system";
import {
  useAccountAddress,
  useHandleTransaction,
  useLivepeerContracts
} from "hooks";

const Index = ({ unbondingLockId, delegate, newPosPrev, newPosNext }) => {
  const accountAddress = useAccountAddress();

  const { bondingManager } = useLivepeerContracts();
  const handleTransaction = useHandleTransaction("rebondFromUnbonded");

  if (!accountAddress) {
    return null;
  }

  return (
    <>
      <Button
        variant="primary"
        size="3"
        onClick={async () => {
          await handleTransaction(
            () =>
              bondingManager.rebondFromUnbondedWithHint(
                delegate,
                unbondingLockId,
                newPosPrev,
                newPosNext
              ),
            { delegate, unbondingLockId, newPosPrev, newPosNext }
          );
        }}
        css={{ mr: "$3" }}
      >
        Redelegate
      </Button>
    </>
  );
};

export default Index;
