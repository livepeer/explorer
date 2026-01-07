import { globalStyles } from "@lib/globalStyles";
import { DesignSystemProvider, getThemes } from "@livepeer/design-system";
import Head from "next/head";
import Router, { useRouter } from "next/router";
import { ThemeProvider } from "next-themes";
import React, { ReactNode, useEffect, useLayoutEffect, useState } from "react";
import { isMobile } from "react-device-detect";
import ReactGA from "react-ga";
import { useWindowSize } from "react-use";

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

const DesignSystemProviderTyped = DesignSystemProvider as React.FC<{
  children?: React.ReactNode;
}>;

const Layout = ({ children, title = "Livepeer Explorer" }) => {
  const { isReady, query } = useRouter();
  const [drawerOpen] = useState(false);
  const { width } = useWindowSize();
  const isBannerDisabledByQuery = query.disableUrlVerificationBanner === "true";

  useEffect(() => {
    const onComplete = () => document.body.removeAttribute("style");
    Router.events.on("routeChangeComplete", onComplete);

    return () => {
      Router.events.off("routeChangeComplete", onComplete);
    };
  }, []);

  // Initialize banner state on mount. skip on SSR/disabled/dismissed.
  useLayoutEffect(() => {
    if (
      !IS_BANNER_ENABLED ||
      typeof window === "undefined" ||
      !isReady ||
      isBannerDisabledByQuery
    ) {
      // Query flag only matters on initial embed load; no client-side toggling.
      return;
    }
  }, [isReady, isBannerDisabledByQuery]);

  // Ensure banner state updates across tabs.
  useEffect(() => {
    if (
      !IS_BANNER_ENABLED ||
      typeof window === "undefined" ||
      !isReady ||
      isBannerDisabledByQuery
    ) {
      return;
    }

    const onStorage = (event: StorageEvent) => {
      if (event.key !== null && event.key !== "bannersDismissed") {
        return;
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [isReady, isBannerDisabledByQuery]);

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
        {children}
      </ThemeProvider>
    </DesignSystemProviderTyped>
  );
};

export const getLayout = (page) => <Layout>{page}</Layout>;

export default Layout;
