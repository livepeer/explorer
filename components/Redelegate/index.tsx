import { Button } from "@livepeer/design-system";
import { useHandleTransaction, useLivepeerContracts } from "hooks";

const Index = ({ unbondingLockId, newPosPrev, newPosNext }) => {
  const { bondingManager } = useLivepeerContracts();
  const handleTransaction = useHandleTransaction("rebond");

  return (
    <>
      <Button
        variant="primary"
        size="3"
        onClick={async () => {
          await handleTransaction(
            () =>
              bondingManager.rebondWithHint(
                unbondingLockId,
                newPosPrev,
                newPosNext
              ),
            { unbondingLockId, newPosPrev, newPosNext }
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
