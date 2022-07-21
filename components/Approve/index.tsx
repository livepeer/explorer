import { useHandleTransaction, useLivepeerContracts } from "hooks";
import { MAXIMUM_VALUE_UINT256 } from "../../lib/utils";
import Button from "../Button";

const Index = () => {
  const { livepeerToken, bondingManager } = useLivepeerContracts();
  const handleTransaction = useHandleTransaction("approve");

  const onClick = async () => {
    await handleTransaction(
      () =>
        livepeerToken.approve(bondingManager.address, MAXIMUM_VALUE_UINT256),
      {
        type: "bond",
        amount: MAXIMUM_VALUE_UINT256,
      }
    );
  };

  return (
    <Button color="primary" onClick={onClick}>
      Approve
    </Button>
  );
};

export default Index;
