import AppBar from "@components/AppBar";
import ConnectButton from "@components/ConnectButton";
import Drawer from "@components/Drawer";
import Hamburger from "@components/Hamburger";
import Logo from "@components/Logo";
import PopoverLink from "@components/PopoverLink";
import ProgressBar from "@components/ProgressBar";
import Search from "@components/Search";
import TxConfirmedDialog from "@components/TxConfirmedDialog";
import TxStartedDialog from "@components/TxStartedDialog";
import TxSummaryDialog from "@components/TxSummaryDialog";
import { IS_L2 } from "@lib/chains";
import { globalStyles } from "@lib/globalStyles";
import {
  Badge,
  Box,
  Button,
  Container,
  DesignSystemProvider,
  Flex,
  Link as A,
  Popover,
  PopoverContent,
  PopoverTrigger,
  SnackbarProvider,
  themes,
} from "@livepeer/design-system";
import {
  ArrowTopRightIcon,
  ChevronDownIcon,
  EyeOpenIcon,
} from "@modulz/radix-icons";
import { usePollsQuery, useProtocolQuery } from "apollo";
import { CHAIN_INFO, DEFAULT_CHAIN_ID } from "lib/chains";
import { ThemeProvider } from "next-themes";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import Router, { useRouter } from "next/router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { isMobile } from "react-device-detect";
import ReactGA from "react-ga";
import { FiX } from "react-icons/fi";
import { useWindowSize } from "react-use";
import { useBlockNumber } from "wagmi";
import {
  useAccountAddress,
  useActiveChain,
  useExplorerStore,
  useOnClickOutside,
} from "../hooks";
import Ballot from "../public/img/ballot.svg";
import DNS from "../public/img/dns.svg";

if (process.env.NODE_ENV === "production") {
  ReactGA.initialize(process.env.NEXT_PUBLIC_GA_TRACKING_ID);
} else {
  ReactGA.initialize("test", { testMode: true });
}

const themeMap = {};
Object.keys(themes).map(
  (key, _index) => (themeMap[themes[key].className] = themes[key].className)
);

type DrawerItem = {
  name: any;
  href: string;
  as: string;
  icon: React.ElementType;
  className?: string;
};

// increment this value when updating the banner
const uniqueBannerID = 3;

export const LAYOUT_MAX_WIDTH = 1400;

const DesignSystemProviderTyped = DesignSystemProvider as React.FC<{
  children?: React.ReactNode;
}>;

const Layout = ({ children, title = "Livepeer Explorer" }) => {
  const { pathname, asPath } = useRouter();
  const { data: protocolData } = useProtocolQuery();
  const { data: pollData } = usePollsQuery();
  const accountAddress = useAccountAddress();
  const activeChain = useActiveChain();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [bannerActive, setBannerActive] = useState(false);
  const { width } = useWindowSize();
  const ref = useRef();
  const blockNumber = useBlockNumber();
  const totalActivePolls = useMemo(
    () =>
      pollData?.polls.filter(
        (p) => (blockNumber.data ?? 0) <= parseInt(p.endBlock)
      ).length,
    [blockNumber, pollData]
  );

  useEffect(() => {
    const storage = JSON.parse(window.localStorage.getItem(`bannersDismissed`));
    if (storage && storage.includes(uniqueBannerID)) {
      setBannerActive(false);
    } else {
      setBannerActive(true);
    }
  }, []);

  useEffect(() => {
    if (width > 1020) {
      document.body.removeAttribute("style");
    }

    if (width < 1020 && drawerOpen) {
      document.body.style.overflow = "hidden";
    }
  }, [drawerOpen, width]);

  useEffect(() => {
    ReactGA.set({
      customBrowserType: !isMobile
        ? "desktop"
        : window["web3"] || window["ethereum"]
        ? "mobileWeb3"
        : "mobileRegular",
    });
    ReactGA.pageview(window.location.pathname + window.location.search);
  }, []);

  const items: DrawerItem[] = [
    {
      name: "Overview",
      href: "/",
      as: "/",
      icon: EyeOpenIcon,
      className: "overview",
    },
    {
      name: "Orchestrators",
      href: "/orchestrators",
      as: "/orchestrators",
      icon: DNS,
      className: "orchestrators",
    },
    {
      name: (
        <Flex css={{ alignItems: "center" }}>
          Voting{" "}
          {totalActivePolls > 0 && (
            <Badge
              size="2"
              variant="green"
              css={{
                ml: "6px",
              }}
            >
              {totalActivePolls}
            </Badge>
          )}
        </Flex>
      ),
      href: "/voting",
      as: "/voting",
      icon: Ballot,
      className: "voting",
    },
  ];

  Router.events.on("routeChangeComplete", () =>
    document.body.removeAttribute("style")
  );

  const onDrawerOpen = () => {
    document.body.style.overflow = "hidden";
    setDrawerOpen(true);
  };
  const onDrawerClose = () => {
    document.body.removeAttribute("style");
    setDrawerOpen(false);
  };

  const { latestTransaction } = useExplorerStore();

  useOnClickOutside(ref, () => {
    onDrawerClose();
  });

  globalStyles();

  return (
    <DesignSystemProviderTyped>
      <ThemeProvider
        disableTransitionOnChange
        attribute="class"
        defaultTheme="dark"
        value={{
          ...themeMap,
          dark: "dark-theme-green",
          light: "light-theme-green",
        }}
      >
        <Head>
          <title>{title}</title>
          <meta charSet="utf-8" />
          <meta
            name="viewport"
            content="initial-scale=1.0, width=device-width"
          />
        </Head>
        <SnackbarProvider>
          <Box css={{ height: "calc(100vh - 82px)" }}>
            {protocolData?.protocol.paused && (
              <Flex
                css={{
                  py: "$2",
                  px: "$2",
                  width: "100%",
                  alignItems: "center",
                  color: "$hiContrast",
                  justifyContent: "center",
                  bc: "amber11",
                  fontWeight: 500,
                  fontSize: "$3",
                }}
              >
                The protocol is currently paused.
              </Flex>
            )}
            {bannerActive && (
              <Flex
                css={{
                  py: 10,
                  display: "none",
                  px: "$2",
                  width: "100%",
                  alignItems: "center",
                  bc: "$neutral4",
                  justifyContent: "center",
                  fontSize: "$2",
                  borderBottom: "1px solid $neutral5",
                  position: "relative",
                  "@bp2": {
                    display: "flex",
                  },
                  "@bp3": {
                    fontSize: "$3",
                  },
                }}
              >
                <Box
                  as="span"
                  css={{
                    mr: "$3",
                    pr: "$3",
                    borderRight: "1px solid",
                    borderColor: "$border",
                  }}
                >
                  <Box as="span">
                    The Livepeer Protocol is now on Arbitrum 🚀
                  </Box>
                </Box>
                <A
                  href="https://medium.com/livepeer-blog/lower-gas-fees-higher-returns-welcome-to-life-on-l2-with-livepeer-a24bb95b479"
                  target="_blank"
                  variant="primary"
                  css={{
                    minWidth: 94,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  Read more <Box as={ArrowTopRightIcon} />
                </A>

                <Box
                  as={FiX}
                  onClick={() => {
                    setBannerActive(false);
                    const storage = JSON.parse(
                      window.localStorage.getItem(`bannersDismissed`)
                    );
                    if (storage) {
                      storage.push(uniqueBannerID);
                      window.localStorage.setItem(
                        `bannersDismissed`,
                        JSON.stringify(storage)
                      );
                    } else {
                      window.localStorage.setItem(
                        `bannersDismissed`,
                        JSON.stringify([uniqueBannerID])
                      );
                    }
                  }}
                  css={{
                    cursor: "pointer",
                    position: "absolute",
                    right: 20,
                    top: 14,
                  }}
                />
              </Flex>
            )}

            <Box css={{}}>
              <Box
                css={{
                  "@bp3": {
                    display: "none",
                  },
                }}
                ref={ref}
              >
                <Drawer
                  onDrawerClose={onDrawerClose}
                  onDrawerOpen={onDrawerOpen}
                  open={drawerOpen}
                  items={items}
                />
              </Box>
              <Box>
                <AppBar
                  css={{
                    zIndex: 10,
                  }}
                  {...{ size: "2", border: true, sticky: true }}
                  color="neutral"
                >
                  <Container css={{ maxWidth: LAYOUT_MAX_WIDTH }}>
                    <Flex
                      css={{
                        justifyContent: "space-between",
                        alignItems: "center",
                        height: 40,
                      }}
                    >
                      <Box
                        css={{
                          "@bp3": {
                            py: "$3",
                            display: "none",
                          },
                        }}
                      >
                        <Hamburger onClick={onDrawerOpen} />
                      </Box>
                      <Flex
                        css={{
                          display: "none",
                          "@bp3": {
                            height: "100%",
                            justifyContent: "center",
                            display: "flex",
                            mr: "$3",
                            mt: "$2",
                          },
                        }}
                      >
                        <Logo isDark id="main" />

                        <Box css={{}}>
                          <Link passHref href="/">
                            <Button
                              size="3"
                              css={{
                                ml: "$4",
                                bc:
                                  asPath === "/"
                                    ? "hsla(0,100%,100%,.05)"
                                    : "transparent",
                                color: "white",
                                "&:hover": {
                                  bc: "hsla(0,100%,100%,.1)",
                                },
                                "&:active": {
                                  bc: "hsla(0,100%,100%,.15)",
                                },
                                "&:disabled": {
                                  opacity: 0.5,
                                },
                              }}
                            >
                              Overview
                            </Button>
                          </Link>
                          <Link passHref href="/orchestrators">
                            <Button
                              size="3"
                              css={{
                                ml: "$2",
                                bc:
                                  !asPath.includes(accountAddress) &&
                                  (asPath.includes("/accounts") ||
                                    asPath.includes("/orchestrators"))
                                    ? "hsla(0,100%,100%,.05)"
                                    : "transparent",
                                color: "white",
                                "&:hover": {
                                  bc: "hsla(0,100%,100%,.1)",
                                },
                                "&:active": {
                                  bc: "hsla(0,100%,100%,.15)",
                                },
                                "&:disabled": {
                                  opacity: 0.5,
                                },
                              }}
                            >
                              Orchestrators
                            </Button>
                          </Link>
                          <Link passHref href="/voting">
                            <Button
                              size="3"
                              css={{
                                ml: "$2",
                                bc: asPath.includes("/voting")
                                  ? "hsla(0,100%,100%,.05)"
                                  : "transparent",
                                color: "white",
                                "&:hover": {
                                  bc: "hsla(0,100%,100%,.1)",
                                },
                                "&:active": {
                                  bc: "hsla(0,100%,100%,.15)",
                                },
                                "&:disabled": {
                                  opacity: 0.5,
                                },
                              }}
                            >
                              Governance{" "}
                              {totalActivePolls > 0 && (
                                <Badge
                                  size="2"
                                  variant="green"
                                  css={{
                                    ml: "6px",
                                  }}
                                >
                                  {totalActivePolls}
                                </Badge>
                              )}
                            </Button>
                          </Link>
                          {accountAddress && (
                            <Link passHref href={`/accounts/${accountAddress}`}>
                              <Button
                                size="3"
                                css={{
                                  ml: "$2",
                                  bc: asPath.includes(accountAddress)
                                    ? "hsla(0,100%,100%,.05)"
                                    : "transparent",
                                  color: "white",
                                  "&:hover": {
                                    bc: "hsla(0,100%,100%,.1)",
                                  },
                                  "&:active": {
                                    bc: "hsla(0,100%,100%,.15)",
                                  },
                                  "&:disabled": {
                                    opacity: 0.5,
                                  },
                                }}
                              >
                                My Account
                              </Button>
                            </Link>
                          )}
                          <Popover>
                            <PopoverTrigger
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                              asChild
                            >
                              <Button
                                size="3"
                                css={{
                                  ml: "$2",
                                  bc: "transparent",
                                  color: "white",
                                  "&:hover": {
                                    bc: "hsla(0,100%,100%,.1)",
                                  },
                                  "&:active": {
                                    bc: "hsla(0,100%,100%,.15)",
                                  },
                                  "&:disabled": {
                                    opacity: 0.5,
                                  },
                                }}
                              >
                                More
                                <Box css={{ ml: "$1" }} as={ChevronDownIcon} />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                              css={{ borderRadius: "$4", bc: "$neutral4" }}
                            >
                              <Flex
                                css={{
                                  flexDirection: "column",
                                  py: "$3",
                                  px: "$2",
                                  borderBottom: "1px solid $neutral6",
                                }}
                              >
                                {IS_L2 && (
                                  <PopoverLink
                                    newWindow={true}
                                    href={`/migrate`}
                                  >
                                    Arbitrum Migration Tool
                                  </PopoverLink>
                                )}
                                <PopoverLink
                                  newWindow={true}
                                  href={`/whats-new`}
                                >
                                  What&apos;s New
                                </PopoverLink>
                                <PopoverLink
                                  newWindow={true}
                                  href={`https://livepeer.org`}
                                >
                                  Livepeer.org
                                </PopoverLink>
                                <PopoverLink
                                  newWindow={true}
                                  href={`https://livepeer.org/docs`}
                                >
                                  Docs
                                </PopoverLink>
                                <PopoverLink
                                  newWindow={true}
                                  href={`https://uniswap.exchange/swap/0x58b6a8a3302369daec383334672404ee733ab239&chain=mainnet`}
                                >
                                  Get LPT
                                </PopoverLink>
                                <PopoverLink
                                  newWindow={true}
                                  href={`https://discord.gg/uaPhtyrWsF`}
                                >
                                  Discord
                                </PopoverLink>
                              </Flex>
                            </PopoverContent>
                          </Popover>
                        </Box>
                      </Flex>

                      <Flex css={{ ml: "auto" }}>
                        <Flex
                          align="center"
                          css={{
                            fontWeight: 600,
                            px: "$2",
                            fontSize: "$2",
                            display: "none",
                            ai: "center",
                            mr: "$2",
                            "@bp1": {
                              display: "flex",
                            },
                          }}
                        >
                          <Image
                            objectFit="contain"
                            width={18}
                            height={18}
                            alt={
                              (
                                CHAIN_INFO[activeChain?.id] ??
                                CHAIN_INFO[DEFAULT_CHAIN_ID]
                              ).label
                            }
                            src={
                              (
                                CHAIN_INFO[activeChain?.id] ??
                                CHAIN_INFO[DEFAULT_CHAIN_ID]
                              ).logoUrl
                            }
                          />
                          <Box css={{ ml: "8px" }}>
                            {
                              (
                                CHAIN_INFO[activeChain?.id] ??
                                CHAIN_INFO[DEFAULT_CHAIN_ID]
                              ).label
                            }
                          </Box>
                        </Flex>
                        <Flex css={{ ai: "center", ml: "8px" }}>
                          <ConnectButton showBalance={false} />
                        </Flex>
                        <Search />
                      </Flex>
                    </Flex>
                  </Container>
                </AppBar>
                <Flex
                  css={{
                    position: "relative",
                    width: "100%",
                    backgroundColor: "$loContrast",
                  }}
                >
                  <Box css={{ width: "100%" }}>
                    {/* {!pathname.includes("/migrate") &&
                      isL2ChainId(DEFAULT_CHAIN_ID) &&
                      accountAddress && <InactiveWarning />} */}
                    {/* {!pathname.includes("/migrate") &&
                      isL2ChainId(DEFAULT_CHAIN_ID) &&
                      accountAddress && <Claim />} */}
                    {children}
                  </Box>
                </Flex>
              </Box>
            </Box>
            <TxConfirmedDialog />
            <TxSummaryDialog />
            <TxStartedDialog />
            {latestTransaction && latestTransaction.step !== "confirmed" && (
              <Box
                css={{
                  position: "fixed",
                  bc: "$panel",
                  borderTop: "1px solid $neutral4",
                  bottom: 0,
                  width: "100%",
                  left: 0,
                  "@bp1": {
                    width: "calc(100% - 240px)",
                    left: 240,
                  },
                  "@bp4": {
                    width: "calc(100vw - ((100vw - 1500px) / 2 + 240px))",
                    left: "calc((100% - 1500px) / 2 + 240px)",
                  },
                }}
              >
                <ProgressBar tx={latestTransaction} />
              </Box>
            )}
          </Box>
        </SnackbarProvider>
      </ThemeProvider>
    </DesignSystemProviderTyped>
  );
};

export const getLayout = (page) => <Layout>{page}</Layout>;

export default Layout;
