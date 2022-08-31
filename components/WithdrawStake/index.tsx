import { Button } from "@livepeer/design-system";
import {
  useAccountAddress,
  useHandleTransaction,
  useBondingManager,
} from "hooks";

const Index = ({ unbondingLockId }) => {
  const accountAddress = useAccountAddress();

  const bondingManager = useBondingManager();
  const handleTransaction = useHandleTransaction("withdrawStake");

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
            () => bondingManager.withdrawStake(unbondingLockId),
            { unbondingLockId }
          );
        }}
        css={{ py: "$2", mr: "$3" }}
      >
        Withdraw
      </Button>
    </>
  );
};

export default Index;
