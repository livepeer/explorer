import {
  useBondingManager,
  useHandleTransaction,
  useLivepeerToken,
} from "hooks";
import { MAXIMUM_VALUE_UINT256 } from "../../lib/utils";
import Button from "../Button";

const Index = () => {
  const livepeerToken = useLivepeerToken();
  const bondingManager = useBondingManager();
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
