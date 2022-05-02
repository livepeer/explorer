
import { isMobile } from "react-device-detect";
import { injected, walletlink } from "../../lib/connectors";
import { SUPPORTED_WALLETS } from "../../constants/wallet";
import {
  Link as A,
  Button,
  Box,
  Card,
  DialogClose,
  DialogTitle,
  Heading,
  Flex,
} from "@livepeer/design-system";
import { Cross1Icon, ArrowTopRightIcon } from "@modulz/radix-icons";
import { CHAIN_INFO, DEFAULT_CHAIN_ID } from "constants/chains";
import { useAccountAddress, useConnectorName } from "hooks";

const AccountDetails = ({ openOptions }) => {
  const accountAddress = useAccountAddress();
  const connectorName = useConnectorName();

  function formatConnectorName() {
    // const isMetaMask =
    //   window["ethereum"] && window["ethereum"].isMetaMask ? true : false;
    // const name = Object.keys(SUPPORTED_WALLETS)
    //   .filter(
    //     (k) =>
    //       SUPPORTED_WALLETS[k].connector === connector &&
    //       (connector !== injected || isMetaMask === (k === "METAMASK"))
    //   )
    //   .map((k) => SUPPORTED_WALLETS[k].name)[0];
    return <Box>{connectorName}</Box>;
  }

  return (
    <Box>
      <Flex
        css={{
          justifyContent: "space-between",
          alignItems: "center",
          mb: "$4",
        }}
      >
        <DialogTitle asChild>
          <Heading size="1" css={{ width: "100%", textAlign: "center" }}>
            Account
          </Heading>
        </DialogTitle>
        <DialogClose asChild>
          <Box
            as={Cross1Icon}
            css={{
              alignSelf: "flex-start",
              cursor: "pointer",
              color: "$white",
              width: 16,
              height: 16,
            }}
          />
        </DialogClose>
      </Flex>
      <Box>
        <Card
          css={{
            backgroundColor: "$neutral3",
            border: "1px solid",
            borderColor: "$neutral6",
            borderRadius: 10,
            p: "$3",
          }}
        >
          <Flex css={{ mb: "$3", justifyContent: "space-between" }}>
            {formatConnectorName()}
            {/* {connector !== injected && connector !== walletlink && (
              <Button
                color="primary"
                outline
                size="small"
                onClick={() => {
                  (connector as any).close();
                }}
              >
                Disconnect
              </Button>
            )} */}
          </Flex>

          <A
            css={{
              display: "flex",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              color: "$primary10",
              alignItems: "center",
            }}
            href={`${CHAIN_INFO[DEFAULT_CHAIN_ID].explorer}address/${accountAddress}`}
            target="__blank"
          >
            {accountAddress}
            <Box as={ArrowTopRightIcon} />
          </A>
        </Card>
        {!(isMobile && (window["web3"] || window["ethereum"])) && (
          <Box css={{ textAlign: "center", mt: "$4" }}>
            <Button
              variant="primary"
              size="4"
              onClick={() => {
                openOptions();
              }}
            >
              Connect to a different wallet
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default AccountDetails;
