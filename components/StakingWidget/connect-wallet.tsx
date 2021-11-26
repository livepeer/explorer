import { useApolloClient, gql } from "@apollo/client";
import { Button } from "@livepeer/design-system";

const ConnectWallet = () => {
  const client = useApolloClient();

  return (
    <Button
      variant="primary"
      size="4"
      onClick={() =>
        client.writeQuery({
          query: gql`
            query {
              walletModalOpen
            }
          `,
          data: {
            walletModalOpen: true,
          },
        })
      }
      css={{ width: "100%" }}
    >
      Connect Wallet
    </Button>
  );
};

export default ConnectWallet;
