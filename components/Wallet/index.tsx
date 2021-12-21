import WalletModal from "@components/WalletModal";
import {
  Box,
  Flex,
  Text,
  Button,
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@livepeer/design-system";
import { ChevronDownIcon } from "@modulz/radix-icons";
import { useWeb3React } from "@web3-react/core";
import { useENS, useBalance } from "../../hooks";

const Wallet = () => {
  const ens = useENS();
  const balance = useBalance();
  const { account, active } = useWeb3React();

  return active ? (
    <Flex css={{ alignItems: "center" }}>
      <Flex
        align="center"
        css={{
          fontWeight: 600,
          borderRadius: "$4",
          fontSize: "$3",
          border: "1px solid $neutral5",
          height: 35,
          ai: "center",
        }}
      >
        <Box css={{ px: "$2" }}>{balance} ETH</Box>
        <Button
          size="3"
          css={{
            bc: "$neutral4",
            borderRadius: "$4",
            height: 35,
            px: "$2",
            py: "$1",
          }}
        >
          {ens ? ens : account.replace(account.slice(6, 38), "…")}
        </Button>
      </Flex>
      <Popover>
        <PopoverTrigger asChild>
          <Flex
            css={{
              ml: "$2",
              border: "1px solid $neutral4",
              bc: "$neutral4",
              width: 35,
              height: 35,
              ai: "center",
              justifyContent: "center",
              borderRadius: 1000,
              cursor: "pointer",
            }}
          >
            <Box as={ChevronDownIcon} css={{ width: 20, height: 20 }} />
          </Flex>
        </PopoverTrigger>
        <PopoverContent css={{ bc: "$neutral4", padding: "$3" }}>
          <Text variant="neutral">Connected As</Text>
        </PopoverContent>
      </Popover>
    </Flex>
  ) : (
    <WalletModal
      trigger={
        <Button variant="primary" size="3">
          Connect Wallet
        </Button>
      }
    />
  );
};

export default Wallet;
