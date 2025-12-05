import ConnectButton from "@components/ConnectButton";
import Drawer from "@components/Drawer";
import { globalStyles } from "@lib/globalStyles";
import {
  Badge,
  Box,
  Button,
  DesignSystemProvider,
  Flex,
  getThemes,
  SnackbarProvider,
} from "@livepeer/design-system";
import { EyeOpenIcon } from "@modulz/radix-icons";
import { usePollsQuery, useTreasuryProposalsQuery } from "apollo";
import { BigNumber } from "ethers";
import Head from "next/head";
import Link from "next/link";
import Router, { useRouter } from "next/router";
import { ThemeProvider } from "next-themes";
import React, { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { isMobile } from "react-device-detect";
import ReactGA from "react-ga";
import { useWindowSize } from "react-use";

import {
  useAccountAddress,
  useCurrentRoundData,
  useOnClickOutside,
  usePendingFeesAndStakeData,
} from "../hooks";
import Ballot from "../public/img/ballot.svg";
import DNS from "../public/img/dns.svg";

export const IS_BANNER_ENABLED = true;

if (process.env.NODE_ENV === "production") {
  ReactGA.initialize(process.env.NEXT_PUBLIC_GA_TRACKING_ID ?? "");
} else {
  ReactGA.initialize("test", { testMode: true });
}

const themeMap = getThemes();

export type DrawerItem = {
  name: ReactNode;
  href: string;
  as: string;
  icon: React.ElementType;
  className?: string;
};

export const LAYOUT_MAX_WIDTH = 1400;

const DesignSystemProviderTyped = DesignSystemProvider as React.FC<{
  children?: React.ReactNode;
}>;

const Layout = ({ children, title = "Livepeer Explorer" }) => {
  const { asPath } = useRouter();
  const { data: pollData } = usePollsQuery();
  const { data: treasuryProposalsData } = useTreasuryProposalsQuery();
  const accountAddress = useAccountAddress();
  const [drawerOpen, setDrawerOpen] = useState(false);
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
    if (!IS_BANNER_ENABLED || typeof window === "undefined") {
      return;
    }

    const onStorage = (event: StorageEvent) => {
      if (event.key !== null && event.key !== "bannersDismissed") {
        return;
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
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
  ];

  const onDrawerOpen = () => {
    document.body.style.overflow = "hidden";
    setDrawerOpen(true);
  };
  const onDrawerClose = () => {
    document.body.removeAttribute("style");
    setDrawerOpen(false);
  };

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
          <div>
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
            {accountAddress && (
              <Link passHref href={`/accounts/${accountAddress}/delegating`}>
                <Button
                  size="3"
                  css={{
                    marginLeft: "$2",
                    backgroundColor: asPath.includes(accountAddress)
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
            <ConnectButton showBalance={false} />
          </div>
          {children}
        </SnackbarProvider>
      </ThemeProvider>
    </DesignSystemProviderTyped>
  );
};

export const getLayout = (page) => <Layout>{page}</Layout>;

export default Layout;
