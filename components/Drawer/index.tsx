import Logo from "../Logo";
import Link from "next/link";
import Router, { useRouter } from "next/router";
import UniswapModal from "../UniswapModal";
import Account from "../Account";
import { Box, Flex, Text, Link as LivepeerLink } from "@jjasonn.stone/design-system";
import { IS_L2 } from "lib/chains";

const Index = ({ items = [], open, onDrawerOpen, onDrawerClose }: any) => {
  const router = useRouter();
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
          <Logo isDark id="drawer" />
          <Box css={{ mb: "auto" }}>
            {items.map((item, i) => (
              <Link
                key={i}
                href={item.href}
                as={item.as}
                legacyBehavior
              >
                <LivepeerLink
                  variant="subtle"
                  css={{
                    color: asPath.split("?")[0] === item.as ? "$hiContrast" : "$neutral11",
                    display: "flex",
                    fontSize: "$3",
                    fontWeight: 500,
                    cursor: "pointer",
                    alignItems: "center",
                    py: "$2",
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
                      width: 18,
                      height: 18,
                      mr: "$2",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <item.icon />
                  </Flex>
                  <Box>
                    {item.name}
                  </Box>
                </LivepeerLink>
              </Link>
            ))}
            <Account />
          </Box>
          <Box css={{ mb: "$4" }}>
            <Box
              css={{
                pb: "$4",
              }}
            >
              <LivepeerLink
                css={{ fontSize: "$2", mb: "$2", display: "block" }}
                href="https://livepeer.org"
                target="_blank"
                rel="noopener noreferrer"
              >
                Livepeer.org
              </LivepeerLink>
              {IS_L2 && (
                <Link
                  href="/migrate"
                  className="link"
                  style={{
                    fontSize: "var(--fontSizes-2)",
                    marginBottom: "8px",
                    display: "block",
                    color: "inherit",
                    textDecoration: "none"
                  }}
                >
                  L2 Migration Tool
                </Link>
              )}
              <LivepeerLink
                css={{ fontSize: "$2", mb: "$2", display: "block" }}
                href="https://livepeer.org/docs"
                target="_blank"
                rel="noopener noreferrer"
              >
                Docs
              </LivepeerLink>

              <UniswapModal
                trigger={
                  <Text
                    css={{
                      cursor: "pointer",
                      fontSize: "$2",
                      mb: "$2",
                      display: "block",
                      color: "hiContrast",
                      "&:hover": {
                        opacity:0.8
                      }
                    }}
                  >
                    Get LPT
                  </Text>
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
              <LivepeerLink
                css={{ fontSize: "$2", mb: "$2", display: "block" }}
                href="https://discord.gg/uaPhtyrWsF"
                target="_blank"
                rel="noopener noreferrer"
              >
                Discord
              </LivepeerLink>

              <Link
                href="/whats-new"
                className="link"
                style={{
                  fontSize: "var(--fontSizes-2)",
                  marginBottom: "8px",
                  display: "block",
                  color: "inherit",
                  textDecoration: "none"
                }}
              >
                What&apos;s New
              </Link>
            </Box>
          </Box>
        </Flex>
      </Flex>
    </>
  );
};

export default Index;
