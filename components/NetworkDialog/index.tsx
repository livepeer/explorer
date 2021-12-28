import { switchToNetwork } from "@lib/switchToNetwork";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Box,
  Text,
  Heading,
  Button,
} from "@livepeer/design-system";
import { useWeb3React } from "@web3-react/core";
import { DEFAULT_CHAIN_ID } from "constants/chains";

const NetworkDialog = () => {
  const { chainId, error, library } = useWeb3React();
  const isMetamask = library?.connection?.url === "metamask";

  return (
    <Dialog open={!!error || (chainId && chainId !== DEFAULT_CHAIN_ID)}>
      <DialogContent css={{ maxWidth: 370, p: 0 }}>
        <DialogTitle asChild>
          <Heading
            size="1"
            css={{
              px: "$4",
              py: "$3",
              fontSize: "$4",
              textAlign: "center",
              fontWeight: 600,
              borderBottom: "1px solid $neutral4",
            }}
          >
            Wrong Network Detected
          </Heading>
        </DialogTitle>
        <Box css={{ p: "$5" }}>
          <Text
            css={{
              fontSize: "$4",
            }}
          >
            To use the Explorer, please switch your network to Arbitrum Rinkeby.
          </Text>
          {isMetamask && (
            <Button
              onClick={() => {
                switchToNetwork({ library, chainId: DEFAULT_CHAIN_ID });
              }}
              size="4"
              variant="primary"
              css={{ mt: "$4", width: "100%" }}
            >
              Switch Network
            </Button>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default NetworkDialog;
