import { useApolloClient, gql } from "@apollo/client";
import WalletModal from "@components/WalletModal";
import { Button } from "@livepeer/design-system";

const ConnectWallet = () => {
  return (
    <WalletModal
      trigger={
        <Button css={{ width: "100%" }} variant="primary" size="4">
          Connect Wallet
        </Button>
      }
    />
  );
};

export default ConnectWallet;
