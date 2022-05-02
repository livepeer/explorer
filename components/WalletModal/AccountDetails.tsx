import { isMobile } from "react-device-detect";
import { injected, walletlink } from "../../lib/connectors";
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
import {
  useAccountAddress,
  useConnectorName,
  useDisconnectWallet,
} from "hooks";

const AccountDetails = ({ openOptions }) => {
  const accountAddress = useAccountAddress();
  const connectorName = useConnectorName();
  const disconnect = useDisconnectWallet();

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
            <Box>{connectorName}</Box>
            <Button
              color="primary"
              outline
              size="small"
              onClick={() => {
                disconnect();
              }}
            >
              Disconnect {connectorName}
            </Button>
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
