import Link from "next/link";
import AccountIcon from "../../public/img/account.svg";
import { useRef, useState } from "react";
import { useWeb3React } from "@web3-react/core";
import { useRouter } from "next/router";
import WalletIcon from "../../public/img/wallet.svg";
import {
  ChevronDownIcon,
  ExitIcon,
  ResetIcon,
  PersonIcon,
} from "@modulz/radix-icons";
import {
  Box,
  Flex,
  Link as A,
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuGroup,
  DropdownMenuRadioGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@livepeer/design-system";
import WalletModal from "components/WalletModal";

const AccountMenu = ({ isInHeader = false }) => {
  const router = useRouter();
  const { asPath } = router;
  const context = useWeb3React();
  const ref = useRef();
  const [isAccountMenuOpen, setAccountMenuOpen] = useState(false);

  return context?.active ? (
    <Box ref={ref} css={{ position: "relative" }}>
      <Flex css={{ alignItems: "center" }}>
        <Link
          href="/accounts/[account]/[slug]"
          as={`/accounts/${context.account}/delegating`}
          passHref
        >
          <A
            variant="subtle"
            css={{
              color:
                asPath.split("?")[0] ===
                `/accounts/${context.account}/delegating`
                  ? "$hiContrast"
                  : "$neutral11",
              lineHeight: "initial",
              display: "flex",
              fontSize: "$3",
              fontWeight: 500,
              cursor: "pointer",
              alignItems: "center",
              py: "$2",
              backgroundColor: "transparent",
              borderRadius: 5,
              transition: "color .3s",
              "&:hover": {
                textDecoration: "none",
                color: "white",
                transition: "color .3s",
              },
            }}
          >
            <Flex
              css={{
                width: 18,
                height: 18,
                mr: "$2",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <AccountIcon />
            </Flex>
            <Box>
              {context.account.replace(context.account.slice(5, 39), "…")}
            </Box>
          </A>
        </Link>
      </Flex>

      {isAccountMenuOpen && (
        <Box
          css={{
            top: 50,
            position: "absolute",
            backgroundColor: "$neutral3",
            border: "1px solid $neutral6",
            borderRadius: 10,
            width: "100%",
            left: 0,
            p: "$3",
            zIndex: 1,
            fontSize: "$2",
          }}
        >
          <Link
            href="/accounts/[account]/[slug]"
            as={`/accounts/${context.account}/delegating`}
            passHref
          >
            <A
              variant="subtle"
              css={{
                color: "$hiContrast",
                display: "flex",
                mb: "$3",
                alignItems: "center",
                cursor: "pointer",
                transition: ".2s",
                opacity: 0.7,
                "&:hover": {
                  transition: ".2s",
                  opacity: 1,
                },
              }}
            >
              <Box as={PersonIcon} css={{ mr: "$3" }} />
              View Profile
            </A>
          </Link>
          <WalletModal
            trigger={
              <Flex
                css={{
                  mb: "$3",
                  alignItems: "center",
                  cursor: "pointer",
                  transition: ".2s",
                  opacity: 0.7,
                  "&:hover": {
                    transition: ".2s",
                    opacity: 1,
                  },
                }}
              >
                <Box as={ResetIcon} css={{ mr: "$3" }} />
                Switch wallet
              </Flex>
            }
          />

          <Flex
            css={{
              alignItems: "center",
              cursor: "pointer",
              transition: ".2s",
              opacity: 0.7,
              "&:hover": {
                transition: ".2s",
                opacity: 1,
              },
            }}
            onClick={() => {
              setAccountMenuOpen(false);
              context.deactivate();
            }}
          >
            <Box as={ExitIcon} css={{ mr: "$3" }} />
            Disconnect
          </Flex>
        </Box>
      )}
    </Box>
  ) : (
    <Box>
      {isInHeader ? (
        <Button
          css={{
            mt: "3px",
            fontSize: 14,
            textTransform: "initial",
            borderRadius: 8,
            ml: "$3",
            fontWeight: 600,
            cursor: "pointer",
          }}
          color="primary"
          outline
          size="small"
        >
          Connect Wallet
        </Button>
      ) : (
        <WalletModal
          trigger={
            <Box
              css={{
                color: "$neutral11",
                lineHeight: "initial",
                display: "flex",
                fontSize: "$3",
                fontWeight: 500,
                cursor: "pointer",
                alignItems: "center",
                py: "$2",
                backgroundColor: "transparent",
                borderRadius: 5,
                transition: "color .3s",
                "&:hover": {
                  color: "$primary",
                  transition: "color .3s",
                },
              }}
            >
              <Flex
                css={{
                  width: 18,
                  height: 18,
                  mr: "$3",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <WalletIcon />
              </Flex>
              Connect Wallet
            </Box>
          }
        />
      )}
    </Box>
  );
};

export default AccountMenu;
