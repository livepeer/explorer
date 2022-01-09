import {
  Box,
  Container,
  Flex,
  globalCss,
  themes,
  Badge,
  SnackbarProvider,
  DesignSystemProvider,
} from "@livepeer/design-system";
import { EyeOpenIcon } from "@modulz/radix-icons";
import { FiArrowRight, FiX } from "react-icons/fi";
import { isMobile } from "react-device-detect";
import { MutationsContext } from "core/contexts";
import { ThemeProvider } from "next-themes";
import { useMutations, useOnClickOutside } from "core/hooks";
import { useQuery, useApolloClient, gql } from "@apollo/client";
import { useWeb3React } from "@web3-react/core";
import AppBar from "@components/AppBar";
import Ballot from "../public/img/ballot.svg";
import DNS from "../public/img/dns.svg";
import Drawer from "@components/Drawer";
import { transactionsQuery } from "core/queries/transactionsQuery";
import Head from "next/head";
import Header from "@components/Header";
import Link from "next/link";
import ProgressBar from "@components/ProgressBar";
import React, { useState, useEffect, useRef } from "react";
import ReactGA from "react-ga";
import Router, { useRouter } from "next/router";
import Search from "@components/Search";
import TxConfirmedDialog from "@components/TxConfirmedDialog";
import TxStartedDialog from "@components/TxStartedDialog";
import TxSummaryDialog from "@components/TxSummaryDialog";
import useWindowSize from "react-use/lib/useWindowSize";
import WalletModal from "@components/WalletModal";
import Claim from "@components/Claim";
import Wallet from "@components/Wallet";
import NetworkDialog from "@components/NetworkDialog";
import Hamburger from "@components/Hamburger";
import { CHAIN_INFO, DEFAULT_CHAIN_ID } from "constants/chains";

if (process.env.NODE_ENV === "production") {
  ReactGA.initialize(process.env.NEXT_PUBLIC_GA_TRACKING_ID);
} else {
  ReactGA.initialize("test", { testMode: true });
}

const globalStyles = globalCss({
  "*, *::before, *::after": {
    boxSizing: "border-box",
  },

  body: {
    backgroundColor: "$loContrast",
    margin: 0,
    color: "$hiContrast",
    fontFamily: "$body",
    WebkitFontSmoothing: "antialiased",
    MozOsxFontSmoothing: "grayscale",
    WebkitTextSizeAdjust: "100%",
  },

  svg: {
    display: "block",
    verticalAlign: "middle",
  },

  "pre, code": { margin: 0, fontFamily: "$mono" },

  "#__next": {
    position: "relative",
    zIndex: 0,
  },

  "h1, h2, h3, h4, h5": { fontWeight: 500 },
});

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
const uniqueBannerID = 2;

const Layout = ({
  children,
  title = "Livepeer Explorer",
  headerTitle = "",
}) => {
  const client = useApolloClient();
  const { pathname } = useRouter();
  const { data } = useQuery(
    gql`
      {
        polls {
          isActive
          endBlock
        }
        protocol(id: "0") {
          id
          paused
        }
      }
    `
  );
  const mutations = useMutations();
  const { data: transactionsData } = useQuery(transactionsQuery);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [bannerActive, setBannerActive] = useState(false);
  const [txDialogState, setTxDialogState]: any = useState([]);
  const { width } = useWindowSize();
  const ref = useRef();
  const totalActivePolls = data?.polls.filter((p) => p.isActive).length;
  const GET_TX_SUMMARY_MODAL = gql`
    {
      txSummaryModal @client {
        __typename
        open
        error
      }
    }
  `;

  const { data: txSummaryModalData } = useQuery(GET_TX_SUMMARY_MODAL);

  useEffect(() => {
    const storage = JSON.parse(window.localStorage.getItem(`bannersDismissed`));
    if (storage && storage.includes(uniqueBannerID)) {
      setBannerActive(false);
    } else {
      setBannerActive(false);
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
  const lastTx = transactionsData?.txs[transactionsData?.txs?.length - 1];
  const txStartedDialogOpen =
    lastTx?.confirmed === false &&
    !txDialogState.find((t) => t.txHash === lastTx.txHash)?.pendingDialog
      ?.dismissed;
  const txConfirmedDialogOpen =
    lastTx?.confirmed &&
    !txDialogState.find((t) => t.txHash === lastTx.txHash)?.confirmedDialog
      ?.dismissed;

  useOnClickOutside(ref, () => {
    onDrawerClose();
  });
  globalStyles();

  return (
    <DesignSystemProvider>
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
          <>
            <NetworkDialog />
            <MutationsContext.Provider value={mutations}>
              <Box css={{ height: "calc(100vh - 82px)" }}>
                {data?.protocol.paused && (
                  <Flex
                    css={{
                      py: "$2",
                      px: "$2",
                      width: "100%",
                      alignItems: "center",
                      color: "black",
                      justifyContent: "center",
                      background: "orange",
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
                      bg: "black",
                      justifyContent: "center",
                      fontSize: "$2",
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
                      <Box as="span" css={{ fontWeight: 600 }}>
                        What&apos;s New:
                      </Box>{" "}
                      <Box as="span">Showcasing Network Usage</Box>
                    </Box>
                    <Link passHref href="/whats-new">
                      <Box
                        as="a"
                        css={{
                          minWidth: 94,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          color: "$primary",
                        }}
                      >
                        Read more <Box as={FiArrowRight} css={{ ml: "$1" }} />
                      </Box>
                    </Link>

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

                <WalletModal />
                <Box
                  css={{
                    display: "grid",
                    gridTemplateColumns: "100%",
                    "@bp3": {
                      gridTemplateColumns: "240px 1fr",
                    },
                  }}
                >
                  <Box ref={ref}>
                    <Drawer
                      onDrawerClose={onDrawerClose}
                      onDrawerOpen={onDrawerOpen}
                      open={drawerOpen}
                      items={items}
                    />
                  </Box>
                  <Box>
                    <AppBar size="2" color="neutral" border sticky>
                      <Container size="3">
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
                          <Search
                            css={{
                              display: "none",
                              "@bp2": {
                                display: "flex",
                              },
                            }}
                          />
                          <Flex css={{ ml: "auto" }}>
                            <Wallet />
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
                        {pathname !== "/migrate" &&
                          CHAIN_INFO[DEFAULT_CHAIN_ID].networkType === "L2" && (
                            <Container size="3" css={{ mb: "$7" }}>
                              <Claim />
                            </Container>
                          )}
                        {children}
                      </Box>
                    </Flex>
                  </Box>
                </Box>
                <TxConfirmedDialog
                  isOpen={txConfirmedDialogOpen}
                  onDismiss={() => {
                    setTxDialogState([
                      ...txDialogState.filter(
                        (t) => t.txHash !== lastTx.txHash
                      ),
                      {
                        ...txDialogState.find(
                          (t) => t.txHash === lastTx.txHash
                        ),
                        txHash: lastTx.txHash,
                        confirmedDialog: {
                          dismissed: true,
                        },
                      },
                    ]);
                  }}
                  tx={lastTx}
                />
                <TxSummaryDialog
                  isOpen={txSummaryModalData?.txSummaryModal.open}
                  onDismiss={() => {
                    client.writeQuery({
                      query: gql`
                        query {
                          txSummaryModal {
                            __typename
                            error
                            open
                          }
                        }
                      `,
                      data: {
                        txSummaryModal: {
                          __typename: "TxSummaryModal",
                          error: false,
                          open: false,
                        },
                      },
                    });
                  }}
                />
                {txStartedDialogOpen && (
                  <TxStartedDialog
                    isOpen={txStartedDialogOpen}
                    onDismiss={() => {
                      setTxDialogState([
                        ...txDialogState.filter(
                          (t) => t.txHash !== lastTx.txHash
                        ),
                        {
                          ...txDialogState.find(
                            (t) => t.txHash === lastTx.txHash
                          ),
                          txHash: lastTx.txHash,
                          pendingDialog: {
                            dismissed: true,
                          },
                        },
                      ]);
                    }}
                    tx={lastTx}
                  />
                )}
                {lastTx?.confirmed === false && (
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
                    <ProgressBar tx={lastTx} />
                  </Box>
                )}
              </Box>
            </MutationsContext.Provider>
          </>
        </SnackbarProvider>
      </ThemeProvider>
    </DesignSystemProvider>
  );
};

export const getLayout = (page) => <Layout>{page}</Layout>;

export default Layout;
