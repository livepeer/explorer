import { Button } from "@livepeer/design-system";
import { useAccountAddress } from "hooks";
import { useState } from "react";
import { castSnapshotVote } from "@lib/api/snapshot";
import { useWalletClient } from "wagmi";

type Props = React.ComponentProps<typeof Button> & {
  proposalId: string;
  choice: number;
  reason?: string;
};

const SnapshotVoteButton = ({
  proposalId,
  choice,
  reason,
  children,
  ...props
}: Props) => {
  const accountAddress = useAccountAddress();
  const { data: walletClient } = useWalletClient();
  const [isVoting, setIsVoting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVote = async () => {
    if (!walletClient || !accountAddress) {
      setError("Please connect your wallet");
      return;
    }

    setIsVoting(true);
    setError(null);
    try {
      const provider = walletClient;
      await castSnapshotVote(
        provider,
        accountAddress,
        proposalId,
        choice,
        reason
      );
      
      // Refresh the page to show updated vote
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err) {
      console.error("Error casting vote:", err);
      setError(
        err instanceof Error ? err.message : "Failed to cast vote"
      );
    } finally {
      setIsVoting(false);
    }
  };

  if (!accountAddress) {
    return null;
  }

  return (
    <>
      <Button disabled={isVoting} onClick={handleVote} {...props}>
        {isVoting ? "Voting..." : children}
      </Button>
      {error && (
        <span style={{ color: "red", fontSize: "12px", marginTop: "4px" }}>
          {error}
        </span>
      )}
    </>
  );
};

export default SnapshotVoteButton;
