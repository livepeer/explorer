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
import { DEFAULT_CHAIN_ID, CHAIN_INFO, L1_CHAIN_ID } from "constants/chains";
import { useRouter } from "next/router";

const NetworkDialog = () => {
  const { chainId, error, library } = useWeb3React();
  const { route } = useRouter();
  const isMetamask = library?.connection?.url === "metamask";

  let targetChain = DEFAULT_CHAIN_ID;
  let title = "Unsupported Network Detected";
  let subtitle = (
    <Box>
      To use the Explorer, please switch your network to{" "}
      {CHAIN_INFO[targetChain].label}
    </Box>
  );
  if (route === "/migrate") {
    title = "Arbitrum Migration Tool";
    subtitle = (
      <Box>
        Switch your network to {CHAIN_INFO[L1_CHAIN_ID].label} to proceed with
        migrating your stake and fees to {CHAIN_INFO[DEFAULT_CHAIN_ID].label}.
      </Box>
    );
    targetChain = L1_CHAIN_ID;
  }

  return (
    <Dialog open={!!error || (chainId && chainId !== targetChain)}>
      <DialogContent css={{ maxWidth: 370, width: "100%", p: 0 }}>
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
            {title}
          </Heading>
        </DialogTitle>
        <Box css={{ p: "$5" }}>
          <Text
            css={{
              fontSize: "$4",
            }}
          >
            {subtitle}
          </Text>
          {isMetamask && (
            <Button
              onClick={() => {
                switchToNetwork({ library, chainId: targetChain });
              }}
              size="4"
              variant="primary"
              css={{ mt: "$4", width: "100%" }}
            >
              Switch to {CHAIN_INFO[targetChain].label}
            </Button>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default NetworkDialog;
