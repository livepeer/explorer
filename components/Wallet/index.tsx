import { gql, useQuery } from "@apollo/client";
import WalletModal from "@components/WalletModal";
import {
  Box,
  Flex,
  Text,
  Button,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Link as A,
} from "@livepeer/design-system";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  PersonIcon,
} from "@modulz/radix-icons";
import { useWeb3React } from "@web3-react/core";
import Link from "next/link";
import { useENS, useBalance } from "../../hooks";

const StyledLink = ({ href, children }) => {
  return (
    <Link href={href} passHref>
      <A
        css={{
          display: "flex",
          ai: "center",
          jc: "space-between",
          textDecoration: "none",
          borderRadius: "$2",
          cursor: "pointer",
          mb: "$1",
          px: "$3",
          py: "$2",
          transition: ".2s transform",
          "&:last-child": {
            mb: 0,
          },
          svg: {
            transition: ".2s transform",
            transform: "translateX(0px)",
          },
          "&:hover": {
            bc: "$neutral6",
            svg: {
              transition: ".2s transform",
              transform: "translateX(6px)",
            },
          },
        }}
      >
        {children}
        <Box as={ChevronRightIcon} css={{ width: 16, height: 16 }} />
      </A>
    </Link>
  );
};

const Wallet = () => {
  const ens = useENS();
  const balance = useBalance();
  const { account, active, deactivate } = useWeb3React();
  const query = gql`
    query transcoder($id: ID!) {
      transcoder(id: $id) {
        id
      }
    }
  `;

  const { data } = useQuery(query, {
    variables: {
      id: account?.toLowerCase(),
    },
  });

  const isOrchestrator = data?.transcoder;

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
        <Box
          css={{
            px: "$2",
            fontSize: "$2",
            display: "none",
            "@bp2": { fontSize: "$3", display: "block" },
          }}
        >
          {balance} ETH
        </Box>
        <Link href={`/accounts/${account}/delegating`} passHref>
          <Button
            as={A}
            size="3"
            css={{
              bc: "$neutral4",
              borderRadius: "$4",
              height: 35,
              px: "$2",
              py: "$1",
              fontSize: "$2",
              color: "$hiContrast",
              "&:hover": {
                textDecoration: "none",
              },
              "@bp2": {
                fontSize: "$3",
              },
            }}
          >
            {ens ? ens : account.replace(account.slice(6, 38), "…")}
          </Button>
        </Link>
      </Flex>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            css={{
              ml: "$2",
              width: 35,
              height: 35,
              ai: "center",
              justifyContent: "center",
              borderRadius: 1000,
              p: 0,
            }}
          >
            <Box as={ChevronDownIcon} css={{ width: 20, height: 20 }} />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          css={{ width: 300, borderRadius: "$4", bc: "$neutral4" }}
        >
          <Box
            css={{
              borderBottom: "1px solid $neutral6",
              p: "$3",
            }}
          >
            <Text
              variant="neutral"
              size="1"
              css={{ mb: "$2", fontWeight: 600, textTransform: "uppercase" }}
            >
              Connected As
            </Text>
            <Flex align="center">
              <Flex
                css={{
                  mr: "$2",
                  bc: "$neutral7",
                  width: 30,
                  height: 30,
                  ai: "center",
                  justifyContent: "center",
                  borderRadius: 1000,
                  cursor: "pointer",
                }}
              >
                <Box
                  as={PersonIcon}
                  css={{ color: "$neutral11", width: 20, height: 20 }}
                />
              </Flex>
              <Box css={{ fontWeight: 600 }}>
                {ens ? ens : account.replace(account.slice(6, 38), "…")}
              </Box>
            </Flex>
          </Box>
          <Flex
            css={{
              flexDirection: "column",
              p: "$2",
              borderBottom: "1px solid $neutral6",
            }}
          >
            {isOrchestrator && (
              <StyledLink href={`/accounts/${account}/orchesstrating`}>
                Orchestrating
              </StyledLink>
            )}
            <StyledLink href={`/accounts/${account}/delegating`}>
              Delegating
            </StyledLink>
            <StyledLink href={`/accounts/${account}/history`}>
              History
            </StyledLink>
          </Flex>
          <Flex css={{ flexDirection: "column", p: "$2" }}>
            <WalletModal
              trigger={
                <Box
                  css={{
                    borderRadius: "$2",
                    cursor: "pointer",
                    mb: "$1",
                    px: "$3",
                    py: "$2",
                    "&:hover": {
                      bc: "$neutral6",
                    },
                  }}
                >
                  Switch wallet
                </Box>
              }
            />
            <Box
              css={{
                borderRadius: "$2",
                cursor: "pointer",
                px: "$3",
                py: "$2",
                "&:hover": {
                  bc: "$neutral6",
                },
              }}
              onClick={() => deactivate()}
            >
              Disconnect
            </Box>
          </Flex>
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
