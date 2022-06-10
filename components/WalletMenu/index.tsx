import { gql, useQuery } from "@apollo/client";
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
import Link from "next/link";
import {
  useAccountAddress,
  useAccountEnsData,
  useDisconnectWallet,
} from "../../hooks";

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

const WalletMenu = () => {
  const ens = useAccountEnsData();
  const accountAddress = useAccountAddress();
  const disconnect = useDisconnectWallet();
  const query = gql`
    query transcoder($id: ID!) {
      transcoder(id: $id) {
        id
      }
    }
  `;

  const { data } = useQuery(query, {
    variables: {
      id: accountAddress?.toLowerCase(),
    },
  });

  const isOrchestrator = data?.transcoder;

  return accountAddress ? (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          css={{
            ml: "$2",
            width: 40,
            height: 40,
            ai: "center",
            justifyContent: "center",
            borderRadius: 1000,
            p: 0,
            color: "white",
            transition: "0.125s ease",
            transform: "scale(1)",
            "&:hover": {
              bc: "$neutral4",
              transition: "0.125s ease",
            },
          }}
        >
          <svg
            fill="none"
            height="7"
            width="14"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12.75 1.54001L8.51647 5.0038C7.77974 5.60658 6.72026 5.60658 5.98352 5.0038L1.75 1.54001"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              xmlns="http://www.w3.org/2000/svg"
            />
          </svg>
          {/* <Box as={ChevronDownIcon} css={{ width: 20, height: 20 }} /> */}
        </Button>
      </PopoverTrigger>
      <PopoverContent css={{ width: 300, borderRadius: "$4", bc: "$neutral4" }}>
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
              {ens?.name
                ? ens.name
                : accountAddress.replace(accountAddress.slice(6, 38), "…")}
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
            <StyledLink href={`/accounts/${accountAddress}/orchestrating`}>
              Orchestrating
            </StyledLink>
          )}
          <StyledLink href={`/accounts/${accountAddress}/delegating`}>
            Delegating
          </StyledLink>
          <StyledLink href={`/accounts/${accountAddress}/history`}>
            History
          </StyledLink>
        </Flex>
        <Flex css={{ flexDirection: "column", p: "$2" }}>
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
            onClick={() => disconnect?.()}
          >
            Disconnect
          </Box>
        </Flex>
      </PopoverContent>
    </Popover>
  ) : (
    <></>
  );
};

export default WalletMenu;
