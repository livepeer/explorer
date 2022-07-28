import { Button } from "@livepeer/design-system";
import {
  useAccountAddress,
  useHandleTransaction,
  useLivepeerPoll,
} from "hooks";

const Index = ({ pollAddress, choiceId, children, ...props }) => {
  const accountAddress = useAccountAddress();

  const poll = useLivepeerPoll(pollAddress);
  const handleTransaction = useHandleTransaction("vote");

  if (!accountAddress) {
    return null;
  }

  return (
    <Button
      onClick={async () => {
        await handleTransaction(() => poll.vote(choiceId), { choiceId });
      }}
      {...props}
    >
      {children}
    </Button>
  );
};

export default Index;
