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
import { DEFAULT_CHAIN_ID, CHAIN_INFO } from "constants/chains";
import { useRouter } from "next/router";

const NetworkDialog = () => {
  const { chainId, error, library } = useWeb3React();
  const { route } = useRouter();

  const isMetamask = library?.connection?.url === "metamask";

  if (route === "/migrate") {
    return null;
  }

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
            Unsupported Network Detected
          </Heading>
        </DialogTitle>
        <Box css={{ p: "$5" }}>
          <Text
            css={{
              fontSize: "$4",
            }}
          >
            {route === "/migrate" ? (
              <Box>
                To migrate your stake and fees to{" "}
                {CHAIN_INFO[DEFAULT_CHAIN_ID].label} switch your network to
              </Box>
            ) : (
              <Box>
                To use the Explorer, please switch your network to{" "}
                {CHAIN_INFO[DEFAULT_CHAIN_ID].label}
              </Box>
            )}
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
              Switch to {CHAIN_INFO[DEFAULT_CHAIN_ID].label}
            </Button>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default NetworkDialog;
