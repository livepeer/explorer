import { switchToNetwork } from "@lib/switchToNetwork";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Box,
  Text,
  Heading,
  Button,
  Link as A,
} from "@livepeer/design-system";
import { useWeb3React } from "@web3-react/core";
import {
  DEFAULT_CHAIN_ID,
  CHAIN_INFO,
  L1_CHAIN_ID,
  IS_L2,
} from "constants/chains";
import Link from "next/link";
import { useRouter } from "next/router";
import { ArrowRightIcon } from "@modulz/radix-icons";

const NetworkDialog = () => {
  const { chainId, error, library, deactivate } = useWeb3React();
  const { route } = useRouter();
  const isMetamask = library?.connection?.url === "metamask";

  let targetChain = DEFAULT_CHAIN_ID;
  let title = CHAIN_INFO[chainId]?.label
    ? `You are connected to ${CHAIN_INFO[chainId]?.label}`
    : "Unsupported network";

  let subtitle = (
    <Box css={{ textAlign: "center" }}>
      {IS_L2 ? (
        <Text size="4" variant="neutral">
          Livepeer now uses {CHAIN_INFO[targetChain].label}. To use the
          Explorer, please switch networks
          {!isMetamask ? "in your wallet." : "."}
        </Text>
      ) : (
        <Text>
          To use the Explorer, please switch networks to{" "}
          {CHAIN_INFO[targetChain].label}.
        </Text>
      )}
    </Box>
  );
  if (route === "/migrate") {
    title = `You are connected to ${CHAIN_INFO[chainId]?.label}`;
    subtitle = (
      <Box>
        Switch networks to {CHAIN_INFO[L1_CHAIN_ID].label} to proceed with
        migrating your stake and fees to {CHAIN_INFO[targetChain].label}.
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
          <Button
            onClick={() => {
              deactivate();
            }}
            variant="neutral"
            size="4"
            css={{ mt: "$2", width: "100%" }}
          >
            Dismiss
          </Button>
        </Box>
        {IS_L2 && route !== "/migrate" && (
          <Text
            variant="neutral"
            size="2"
            css={{
              textAlign: "center",
              borderTop: "1px dashed $neutral5",
              pt: "$3",
              pb: "$4",
              px: "$3",
            }}
          >
            Do you operate an orchestrator? Migrate your delegated stake to{" "}
            {CHAIN_INFO[targetChain].label} using the{" "}
            <Link href="/migrate" passHref>
              <A
                variant="primary"
                css={{ display: "inline-flex", ai: "center" }}
              >
                L2 migration tool <ArrowRightIcon />
              </A>
            </Link>
          </Text>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default NetworkDialog;
