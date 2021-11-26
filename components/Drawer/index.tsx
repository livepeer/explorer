import Logo from "../Logo";
import Link from "next/link";
import Router, { useRouter } from "next/router";
import RoundStatus from "../RoundStatus";
import { gql, useApolloClient } from "@apollo/client";
import UniswapModal from "../UniswapModal";
import AccountMenu from "../AccountMenu";
import { Box, Flex, Text, styled, Link as A } from "@livepeer/design-system";

const BottomLink = styled("a", {
  display: "flex",
  alignItems: "center",
  fontSize: "$2",
  color: "$muted",
  transition: "color .3s",
  "&:hover": {
    color: "$primary",
    transition: "color .3s",
  },
});

const Index = ({ items = [], open, onDrawerOpen, onDrawerClose }) => {
  const router = useRouter();
  const client = useApolloClient();
  const { asPath } = router;

  Router.events.on("routeChangeStart", () => {
    onDrawerClose();
  });

  return (
    <>
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
          pt: "$4",
          px: 24,
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
            pt: "$4",
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
          <Logo isDark />
          <Box css={{ mb: "auto" }}>
            {items.map((item, i) => (
              <Link key={i} href={item.href} as={item.as} passHref>
                <A
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
                    py: "$2",
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
                      mr: "$2",
                    }}
                  >
                    <item.icon />
                  </Flex>
                  {item.name}
                </A>
              </Link>
            ))}
            <AccountMenu />
          </Box>
          <Box css={{ mb: "$4" }}>
            <Box
              css={{
                mb: "$4",
                pb: "$4",
                borderBottom: "1px solid $neutral7",
              }}
            >
              <A
                css={{ fontSize: "$2", mb: "$2", display: "block" }}
                href="https://livepeer.org"
                target="_blank"
                rel="noopener noreferrer"
              >
                Livepeer.org
              </A>
              <A
                css={{ fontSize: "$2", mb: "$2", display: "block" }}
                href="https://livepeer.org/docs"
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
                      mb: "$2",
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
                  src={`https://uniswap.exchange/swap/0x58b6a8a3302369daec383334672404ee733ab239`}
                />
              </UniswapModal>
              <A
                css={{ fontSize: "$2", mb: "$2", display: "block" }}
                href="https://discord.gg/uaPhtyrWsF"
                target="_blank"
                rel="noopener noreferrer"
              >
                Discord
              </A>

              <Box>
                <Link href="/whats-new" passHref>
                  <A css={{ fontSize: "$2", mb: "$2", display: "block" }}>
                    What's New
                  </A>
                </Link>
              </Box>
            </Box>
            <RoundStatus />
          </Box>
        </Flex>
      </Flex>
    </>
  );
};

export default Index;
