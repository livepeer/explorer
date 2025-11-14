import AppBar from "@components/AppBar";
import Claim from "@components/Claim";
import ConnectButton from "@components/ConnectButton";
import Drawer from "@components/Drawer";
import Hamburger from "@components/Hamburger";
import InactiveWarning from "@components/InactiveWarning";
import Logo from "@components/Logo";
import PopoverLink from "@components/PopoverLink";
import ProgressBar from "@components/ProgressBar";
import Search from "@components/Search";
import TxConfirmedDialog from "@components/TxConfirmedDialog";
import TxStartedDialog from "@components/TxStartedDialog";
import TxSummaryDialog from "@components/TxSummaryDialog";
import { IS_L2 } from "@lib/chains";
import { globalStyles } from "@lib/globalStyles";
import { EMPTY_ADDRESS } from "@lib/utils";
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
  Skeleton,
  SnackbarProvider,
  Text,
  getThemes,
} from "@livepeer/design-system";
import {
  ArrowTopRightIcon,
  ChevronDownIcon,
  EyeOpenIcon,
} from "@modulz/radix-icons";
import {
  usePollsQuery,
  useProtocolQuery,
  useTreasuryProposalsQuery,
} from "apollo";
import { BigNumber } from "ethers";
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
import { Chain } from "viem";
import {
  useAccountAddress,
  useActiveChain,
  useContractInfoData,
  useCurrentRoundData,
  useExplorerStore,
  useOnClickOutside,
  usePendingFeesAndStakeData,
} from "../hooks";
import Ballot from "../public/img/ballot.svg";
import DNS from "../public/img/dns.svg";
import RegisterToVote from "@components/RegisterToVote";

export const IS_BANNER_ENABLED = false;

if (process.env.NODE_ENV === "production") {
  ReactGA.initialize(process.env.NEXT_PUBLIC_GA_TRACKING_ID ?? "");
} else {
  ReactGA.initialize("test", { testMode: true });
}

const themeMap = getThemes();

type DrawerItem = {
  name: any;
  href: string;
  as: string;
  icon: React.ElementType;
  className?: string;
};

// increment this value when updating the banner
const uniqueBannerID = 4;

export const LAYOUT_MAX_WIDTH = 1400;

const DesignSystemProviderTyped = DesignSystemProvider as React.FC<{
  children?: React.ReactNode;
}>;

const Layout = ({ children, title = "Livepeer Explorer" }) => {
  const { asPath } = useRouter();
  const { data: protocolData } = useProtocolQuery();
  const { data: pollData } = usePollsQuery();
  const { data: treasuryProposalsData } = useTreasuryProposalsQuery();
  const accountAddress = useAccountAddress();
  const activeChain = useActiveChain();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [bannerActive, setBannerActive] = useState(false);
  const { width } = useWindowSize();
  const ref = useRef(null);
  const currentRound = useCurrentRoundData();
  const pendingFeesAndStake = usePendingFeesAndStakeData(accountAddress);

  const totalActivePolls = useMemo(
    () =>
      pollData?.polls.filter(
        (p) =>
          (currentRound?.currentL1Block ?? Number.MAX_VALUE) <=
          parseInt(p.endBlock)
      ).length,
    [currentRound?.currentL1Block, pollData]
  );

  const totalActiveTreasuryProposals = useMemo(() => {
    const currentRoundNumber = currentRound?.id ?? 0;
    return treasuryProposalsData?.treasuryProposals.reduce((count, p) => {
      const voteEndRoundNumber = Number(p.voteEnd);
      return voteEndRoundNumber >= currentRoundNumber ? count + 1 : count;
    }, 0);
  }, [currentRound?.id, treasuryProposalsData?.treasuryProposals]);

  const hasPendingFees = useMemo(
    () => BigNumber.from(pendingFeesAndStake?.pendingFees ?? 0).gt(0),
    [pendingFeesAndStake?.pendingFees]
  );

  useEffect(() => {
    const onComplete = () => document.body.removeAttribute("style");
    Router.events.on("routeChangeComplete", onComplete);
    
    return () => {
      Router.events.off("routeChangeComplete", onComplete);
    };
  }, []);

  useEffect(() => {
    const ls = window.localStorage.getItem(`bannersDismissed`);
    const storage = ls ? JSON.parse(ls) : null;
    if (storage && storage.includes(uniqueBannerID)) {
      setBannerActive(false);
    } else {
      if (IS_BANNER_ENABLED) {
        setBannerActive(true);
      }
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
          Governance{" "}
          {(totalActivePolls ?? 0) > 0 && (
            <Badge
              size="2"
              variant="green"
              css={{
                marginLeft: "6px",
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
    {
      name: (
        <Flex css={{ alignItems: "center" }}>
          Treasury{" "}
          {(totalActiveTreasuryProposals ?? 0) > 0 && (
            <Badge
              size="2"
              variant="green"
              css={{
                marginLeft: "6px",
              }}
            >
              {totalActiveTreasuryProposals}
            </Badge>
          )}
        </Flex>
      ),
      href: "/treasury",
      as: "/treasury",
      icon: Ballot,
      className: "treasury",
    },
    {
      name: "Community",
      href: "/governance",
      as: "/governance",
      icon: Ballot,
      className: "governance",
    },
  ];

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
            {protocolData?.protocol?.paused && (
              <Flex
                css={{
                  paddingTop: "$2",
                  paddingBottom: "$2",
                  paddingLeft: "$2",
                  paddingRight: "$2",
                  width: "100%",
                  alignItems: "center",
                  color: "$hiContrast",
                  justifyContent: "center",
                  backgroundColor: "amber11",
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
                  paddingTop: 10,
                  paddingBottom: 10,
                  display: "none",
                  paddingLeft: "$2",
                  paddingRight: "$2",
                  width: "100%",
                  alignItems: "center",
                  backgroundColor: "$neutral4",
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
                    marginRight: "$3",
                    paddingRight: "$3",
                  }}
                >
                  <Box as="span">
                    The Livepeer Protocol is moving to Arbitrum Nitro - wallet
                    connection is temporarily paused 🚦
                  </Box>
                </Box>

                <Box
                  as={FiX}
                  onClick={() => {
                    setBannerActive(false);
                    const ls = window.localStorage.getItem(`bannersDismissed`);
                    const storage = ls ? JSON.parse(ls) : null;
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
                ref={ref as any}
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
                            paddingTop: "$3",
                            paddingBottom: "$3",
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
                            marginRight: "$3",
                            marginTop: "$2",
                          },
                        }}
                      >
                        <Logo isDark id="main" />

                        <Box css={{}}>
                          <Link passHref href="/">
                            <Button
                              size="3"
                              css={{
                                marginLeft: "$4",
                                backgroundColor:
                                  asPath === "/"
                                    ? "hsla(0,100%,100%,.05)"
                                    : "transparent",
                                color: "white",
                                "&:hover": {
                                  backgroundColor: "hsla(0,100%,100%,.1)",
                                },
                                "&:active": {
                                  backgroundColor: "hsla(0,100%,100%,.15)",
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
                                marginLeft: "$2",
                                backgroundColor:
                                  !asPath.includes(accountAddress ?? "") &&
                                  (asPath.includes("/accounts") ||
                                    asPath.includes("/orchestrators"))
                                    ? "hsla(0,100%,100%,.05)"
                                    : "transparent",
                                color: "white",
                                "&:hover": {
                                  backgroundColor: "hsla(0,100%,100%,.1)",
                                },
                                "&:active": {
                                  backgroundColor: "hsla(0,100%,100%,.15)",
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
                                marginLeft: "$2",
                                backgroundColor: asPath.includes("/voting")
                                  ? "hsla(0,100%,100%,.05)"
                                  : "transparent",
                                color: "white",
                                "&:hover": {
                                  backgroundColor: "hsla(0,100%,100%,.1)",
                                },
                                "&:active": {
                                  backgroundColor: "hsla(0,100%,100%,.15)",
                                },
                                "&:disabled": {
                                  opacity: 0.5,
                                },
                              }}
                            >
                              Governance{" "}
                              {(totalActivePolls ?? 0) > 0 && (
                                <Badge
                                  size="2"
                                  variant="green"
                                  css={{
                                    marginLeft: "6px",
                                  }}
                                >
                                  {totalActivePolls}
                                </Badge>
                              )}
                            </Button>
                          </Link>
                          <Link passHref href="/treasury">
                            <Button
                              size="3"
                              css={{
                                marginLeft: "$2",
                                backgroundColor: asPath.includes("/treasury")
                                  ? "hsla(0,100%,100%,.05)"
                                  : "transparent",
                                color: "white",
                                "&:hover": {
                                  backgroundColor: "hsla(0,100%,100%,.1)",
                                },
                                "&:active": {
                                  backgroundColor: "hsla(0,100%,100%,.15)",
                                },
                                "&:disabled": {
                                  opacity: 0.5,
                                },
                              }}
                            >
                              Treasury{" "}
                              {(totalActiveTreasuryProposals ?? 0) > 0 && (
                                <Badge
                                  size="2"
                                  variant="green"
                                  css={{
                                    marginLeft: "6px",
                                  }}
                                >
                                  {totalActiveTreasuryProposals}
                                </Badge>
                              )}
                            </Button>
                          </Link>
                          <Link passHref href="/governance">
                            <Button
                              size="3"
                              css={{
                                marginLeft: "$2",
                                backgroundColor: asPath.includes("/governance")
                                  ? "hsla(0,100%,100%,.05)"
                                  : "transparent",
                                color: "white",
                                "&:hover": {
                                  backgroundColor: "hsla(0,100%,100%,.1)",
                                },
                                "&:active": {
                                  backgroundColor: "hsla(0,100%,100%,.15)",
                                },
                                "&:disabled": {
                                  opacity: 0.5,
                                },
                              }}
                            >
                              Community
                            </Button>
                          </Link>
                          {accountAddress && (
                            <Link passHref href={`/accounts/${accountAddress}`}>
                              <Button
                                size="3"
                                css={{
                                  marginLeft: "$2",
                                  backgroundColor: asPath.includes(
                                    accountAddress
                                  )
                                    ? "hsla(0,100%,100%,.05)"
                                    : "transparent",
                                  color: "white",
                                  "&:hover": {
                                    backgroundColor: "hsla(0,100%,100%,.1)",
                                  },
                                  "&:active": {
                                    backgroundColor: "hsla(0,100%,100%,.15)",
                                  },
                                  "&:disabled": {
                                    opacity: 0.5,
                                  },
                                }}
                              >
                                My Account{" "}
                                {hasPendingFees && (
                                  <Badge
                                    size="2"
                                    variant="green"
                                    css={{
                                      marginLeft: "6px",
                                    }}
                                  >
                                    1
                                  </Badge>
                                )}
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
                                  marginLeft: "$2",
                                  backgroundColor: "transparent",
                                  color: "white",
                                  "&:hover": {
                                    backgroundColor: "hsla(0,100%,100%,.1)",
                                  },
                                  "&:active": {
                                    backgroundColor: "hsla(0,100%,100%,.15)",
                                  },
                                  "&:disabled": {
                                    opacity: 0.5,
                                  },
                                }}
                              >
                                More
                                <Box
                                  css={{ marginLeft: "$1" }}
                                  as={ChevronDownIcon}
                                />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent
                              css={{
                                borderRadius: "$4",
                                backgroundColor: "$neutral4",
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                              onPointerEnterCapture={undefined}
                              onPointerLeaveCapture={undefined}
                              placeholder={undefined}
                            >
                              <Flex
                                css={{
                                  flexDirection: "column",
                                  paddingTop: "$3",
                                  paddingBottom: "$3",
                                  paddingLeft: "$2",
                                  paddingRight: "$2",
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
                                  href={`https://docs.livepeer.org`}
                                >
                                  Docs
                                </PopoverLink>
                                <PopoverLink
                                  newWindow={true}
                                  href={`https://app.uniswap.org/#/tokens/ethereum/0x58b6a8a3302369daec383334672404ee733ab239`}
                                >
                                  Get LPT
                                </PopoverLink>
                                <PopoverLink
                                  newWindow={true}
                                  href={`https://discord.gg/livepeer`}
                                >
                                  Discord
                                </PopoverLink>
                              </Flex>
                            </PopoverContent>
                          </Popover>
                        </Box>
                      </Flex>

                      <Flex css={{ marginLeft: "auto" }}>
                        <ContractAddressesPopover activeChain={activeChain} />
                        <Flex css={{ alignItems: "center", marginLeft: "8px" }}>
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
                    {!asPath.includes("/migrate") && accountAddress && (
                      <InactiveWarning />
                    )}
                    {!asPath?.includes("/migrate") && accountAddress && (
                      <Claim />
                    )}
                    {!asPath?.includes("/migrate") && accountAddress && (
                      <RegisterToVote />
                    )}
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
                  backgroundColor: "$panel",
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

const ContractAddressesPopover = ({ activeChain }: { activeChain?: Chain }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const contractAddresses = useContractInfoData(isOpen);

  return (
    <Popover onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Flex
          align="center"
          css={{
            cursor: "pointer",
            fontWeight: 600,
            paddingLeft: "$2",
            paddingRight: "$2",
            fontSize: "$2",
            display: "none",
            alignItems: "center",
            marginRight: "$2",
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
                CHAIN_INFO[activeChain?.id ?? ""] ??
                CHAIN_INFO[DEFAULT_CHAIN_ID]
              ).label
            }
            src={
              (
                CHAIN_INFO[activeChain?.id ?? ""] ??
                CHAIN_INFO[DEFAULT_CHAIN_ID]
              ).logoUrl
            }
          />
          <Box css={{ marginLeft: "8px" }}>
            {
              (
                CHAIN_INFO[activeChain?.id ?? ""] ??
                CHAIN_INFO[DEFAULT_CHAIN_ID]
              ).label
            }
          </Box>

          <Box
            as={ChevronDownIcon}
            css={{ color: "$neutral11", marginLeft: "$1" }}
          />
        </Flex>
      </PopoverTrigger>
      <PopoverContent
        css={{
          minWidth: 350,
          borderRadius: "$4",
          bc: "$neutral4",
        }}
        placeholder={undefined}
        onPointerEnterCapture={undefined}
        onPointerLeaveCapture={undefined}
      >
        <Box
          css={{
            padding: "$4",
          }}
        >
          <Box css={{}}>
            <Text
              size="1"
              css={{
                marginBottom: "$2",
                fontWeight: 600,
                textTransform: "uppercase",
              }}
            >
              {`Contract Addresses`}
            </Text>

            {Object.keys(contractAddresses ?? {})
              .filter(
                (key) => contractAddresses?.[key]?.address !== EMPTY_ADDRESS
              )
              .map((key) => (
                <Flex key={key}>
                  {contractAddresses?.[key] ? (
                    <>
                      <Text
                        variant="neutral"
                        css={{
                          marginBottom: "$1",
                        }}
                        size="2"
                      >
                        {contractAddresses?.[
                          key as keyof typeof contractAddresses
                        ]?.name ?? ""}
                      </Text>
                      <A
                        css={{
                          marginLeft: "auto",

                          marginBottom: "$1",
                        }}
                        target="_blank"
                        href={
                          contractAddresses?.[
                            key as keyof typeof contractAddresses
                          ]?.link
                        }
                      >
                        <Text
                          css={{
                            display: "block",
                            fontWeight: 600,
                            color: "$white",
                          }}
                          size="2"
                        >
                          {contractAddresses?.[
                            key as keyof typeof contractAddresses
                          ]?.address?.replace(
                            contractAddresses?.[
                              key as keyof typeof contractAddresses
                            ]?.address?.slice(7, 37) ?? "",
                            "…"
                          )}
                        </Text>
                      </A>
                    </>
                  ) : (
                    <Skeleton
                      css={{
                        marginBottom: "$1",

                        marginLeft: "auto",
                        maxWidth: "100%",
                        width: "100%",
                        height: 15,
                      }}
                    />
                  )}
                </Flex>
              ))}

            <Link
              passHref
              href="https://docs.livepeer.org/references/contract-addresses"
            >
              <A>
                <Flex
                  css={{
                    marginTop: "$2",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    css={{ whiteSpace: "nowrap" }}
                    variant="neutral"
                    size="1"
                  >
                    Learn more about these contracts
                  </Text>
                  <Box
                    css={{
                      marginLeft: "$1",
                      width: 15,
                      height: 15,
                    }}
                    as={ArrowTopRightIcon}
                  />
                </Flex>
              </A>
            </Link>
          </Box>
        </Box>
      </PopoverContent>
    </Popover>
  );
};

export const getLayout = (page) => <Layout>{page}</Layout>;

export default Layout;
