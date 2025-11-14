import Logo from "../Logo";
import Link from "next/link";
import Router, { useRouter } from "next/router";
import UniswapModal from "../UniswapModal";
import Account from "../Account";
import { Box, Flex, Text, Link as A } from "@livepeer/design-system";
import { IS_L2 } from "lib/chains";
import { useEffect } from "react";
import { DrawerItem } from "@layouts/main";

const Index = ({
  items = [],
  open,
  onDrawerOpen,
  onDrawerClose,
}: {
  items: DrawerItem[];
  open: boolean;
  onDrawerOpen: () => void;
  onDrawerClose: () => void;
}) => {
  const router = useRouter();
  const { asPath } = router;

  useEffect(() => {
    const onStart = () => onDrawerClose();
    Router.events.on("routeChangeStart", onStart);
    
    return () => {
      Router.events.off("routeChangeStart", onStart);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Flex
      onClick={onDrawerOpen}
      css={{
        left: 0,
        top: 0,
        backgroundColor: "$panel",
        zIndex: 100,
        width: 240,
        transition: ".3s",
        transform: `translateX(${open ? 0 : "-100%"})`,
        position: "fixed",
        flexDirection: "column",
        height: "100vh",
        paddingTop: "$4",
        paddingLeft: 24,
        paddingRight: 24,
        borderRight: "1px solid $colors$neutral4",
        alignItems: "center",
        justifyContent: "space-between",
        "&:after": {
          pointerEvents: "none",
          content: '""',
          position: "absolute",
          height: "550px",
          top: "0",
          left: "0",
          width: "100%",
        },
        "@bp2": {
          paddingTop: "$4",
        },
        "@bp3": {
          boxShadow: "none",
          transform: "none",
          position: "sticky",
        },
      }}
    >
      <Flex
        css={{
          alignSelf: "flex-start",
          flexDirection: "column",
          width: "100%",
          height: "100%",
        }}
      >
        <Logo isDark id="drawer" />
        <Box css={{ marginBottom: "auto" }}>
          {items.map((item, i) => (
            <A
              as={Link}
              key={i}
              href={item.href}
              passHref
              variant="subtle"
              css={{
                color:
                  asPath.split("?")[0] === item.as
                    ? "$hiContrast"
                    : "$neutral11",
                lineHeight: "initial",
                display: "flex",
                fontSize: "$3",
                fontWeight: 500,
                cursor: "pointer",
                alignItems: "center",
                paddingTop: "$2",
                paddingBottom: "$2",
                borderRadius: 5,
                transition: "color .3s",
                "&:hover": {
                  textDecoration: "none",
                  color: "$hiContrast",
                  transition: "color .3s",
                },
              }}
            >
              <Flex
                css={{
                  alignItems: "center",
                  justifyContent: "center",
                  width: 18,
                  height: 18,
                  marginRight: "$2",
                }}
              >
                <item.icon />
              </Flex>
              {item.name}
            </A>
          ))}
          <Account />
        </Box>
        <Box css={{ marginBottom: "$4" }}>
          <Box
            css={{
              paddingBottom: "$4",
            }}
          >
            <A
              css={{ fontSize: "$2", marginBottom: "$2", display: "block" }}
              href="https://livepeer.org"
              target="_blank"
              rel="noopener noreferrer"
            >
              Livepeer.org
            </A>
            {IS_L2 && (
              <A
                as={Link}
                href="/migrate"
                passHref
                css={{ fontSize: "$2", marginBottom: "$2", display: "block" }}
              >
                L2 Migration Tool
              </A>
            )}
            <A
              css={{ fontSize: "$2", marginBottom: "$2", display: "block" }}
              href="https://docs.livepeer.org"
              target="_blank"
              rel="noopener noreferrer"
            >
              Docs
            </A>

            <UniswapModal
              trigger={
                <A
                  as={Text}
                  css={{
                    cursor: "pointer",
                    fontSize: "$2",
                    marginBottom: "$2",
                    display: "block",
                  }}
                >
                  Get LPT
                </A>
              }
            >
              <Box
                as="iframe"
                css={{
                  backgroundColor: "$panel",
                  width: "100%",
                  height: "100%",
                  border: "0",
                }}
                src={`https://app.uniswap.org/#/tokens/ethereum/0x58b6a8a3302369daec383334672404ee733ab239`}
              />
            </UniswapModal>
            <A
              css={{ fontSize: "$2", marginBottom: "$2", display: "block" }}
              href="https://discord.gg/livepeer"
              target="_blank"
              rel="noopener noreferrer"
            >
              Discord
            </A>

            <Box>
              <A
                as={Link}
                href="/whats-new"
                passHref
                css={{ fontSize: "$2", marginBottom: "$2", display: "block" }}
              >
                What&apos;s New
              </A>
            </Box>
          </Box>
        </Box>
      </Flex>
    </Flex>
  );
};

export default Index;
