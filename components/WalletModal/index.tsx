import { AbstractConnector } from "@web3-react/abstract-connector";
import { useState, useEffect } from "react";
import MetaMaskIcon from "../../public/img/metamask.svg";
import { WalletConnectConnector } from "@web3-react/walletconnect-connector";
import { SUPPORTED_WALLETS } from "../../lib/constants";
import { Injected } from "../../lib/connectors";
import { isMobile } from "react-device-detect";
import { useWeb3React } from "@web3-react/core";
import Option from "./Option";
import PendingView from "./PendingView";
import AccountDetails from "./AccountDetails";
import { usePrevious } from "../../hooks";
import ReactGA from "react-ga";
import {
  Box,
  Flex,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogClose,
  DialogTitle,
  Heading,
} from "@livepeer/design-system";
import { ChevronLeftIcon, Cross1Icon } from "@modulz/radix-icons";

const WALLET_VIEWS = {
  OPTIONS: "options",
  ACCOUNT: "account",
  PENDING: "pending",
};

const Index = ({ trigger = null }) => {
  const { active, account, connector, error, activate } = useWeb3React();
  const [walletView, setWalletView] = useState(WALLET_VIEWS.ACCOUNT);
  const [pendingWallet, setPendingWallet] = useState<
    AbstractConnector | undefined
  >();

  const tryActivation = (_connector: AbstractConnector | undefined) => {
    let name = "";
    Object.keys(SUPPORTED_WALLETS).map((key) => {
      if (_connector === SUPPORTED_WALLETS[key].connector) {
        return (name = SUPPORTED_WALLETS[key].name);
      }
      return true;
    });
    // log selected wallet
    ReactGA.event({
      category: "Wallet",
      action: "Change Wallet",
      label: name,
    });

    setPendingWallet(_connector); // set wallet for pending view
    setWalletView(WALLET_VIEWS.PENDING);
    // if the connector is walletconnect and the user has already tried to connect, manually reset the connector
    if (
      _connector instanceof WalletConnectConnector &&
      _connector.walletConnectProvider?.wc?.uri
    ) {
      _connector.walletConnectProvider = undefined;
    }

    activate(_connector, undefined, true);
  };

  const activePrevious = usePrevious(active);
  const connectorPrevious = usePrevious(connector);

  useEffect(() => {
    if (
      (active && !activePrevious) ||
      (connector && connector !== connectorPrevious && !error)
    ) {
      setWalletView(WALLET_VIEWS.ACCOUNT);
    }
  }, [
    setWalletView,
    active,
    error,
    connector,
    activePrevious,
    connectorPrevious,
  ]);

  useEffect(() => {
    if (active) {
      setWalletView(WALLET_VIEWS.ACCOUNT);
    }
  }, [setWalletView, active]);

  function getOptions() {
    const isMetamask = window["ethereum"] && window["ethereum"].isMetaMask;
    return Object.keys(SUPPORTED_WALLETS).map((key) => {
      const option = SUPPORTED_WALLETS[key];

      // check for mobile options
      if (isMobile) {
        if (!window["web3"] && !window["ethereum"] && option.mobile) {
          return (
            <Option
              onClick={() => {
                option.connector !== connector &&
                  !option.href &&
                  tryActivation(option.connector);
              }}
              key={key}
              active={option.connector && option.connector === connector}
              color={option.color}
              link={option.href}
              header={option.name}
              subheader={null}
              Icon={option.icon}
            />
          );
        }
        return null;
      }

      // overwrite injected when needed
      if (option.connector === Injected) {
        // don't show injected if there's no injected provider
        if (!(window["web3"] || window["ethereum"])) {
          if (option.name === "MetaMask") {
            return (
              <Option
                key={key}
                color={"#E8831D"}
                header={"Install Metamask"}
                subheader={null}
                link={"https://metamask.io/"}
                Icon={MetaMaskIcon}
              />
            );
          } else {
            return null; // dont want to return install twice
          }
        }
        // don't return metamask if injected provider isn't metamask
        else if (option.name === "MetaMask" && !isMetamask) {
          return null;
        }
        // likewise for generic
        else if (option.name === "Injected" && isMetamask) {
          return null;
        }
      }

      // return rest of options
      return (
        !isMobile &&
        !option.mobileOnly && (
          <Option
            onClick={() => {
              option.connector === connector
                ? setWalletView(WALLET_VIEWS.ACCOUNT)
                : !option.href && tryActivation(option.connector);
            }}
            key={key}
            active={option.connector === connector}
            color={option.color}
            link={option.href}
            header={option.name}
            subheader={null} //use option.descriptio to bring back multi-line
            Icon={option.icon}
          />
        )
      );
    });
  }

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <Box css={{ minWidth: 375 }}>
          {account && walletView === WALLET_VIEWS.ACCOUNT ? (
            <AccountDetails
              openOptions={() => setWalletView(WALLET_VIEWS.OPTIONS)}
            />
          ) : (
            <Box>
              <Flex
                css={{
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: "$4",
                }}
              >
                <DialogTitle asChild>
                  <Heading size="1" css={{ textAlign: "center" }}>
                    {walletView !== WALLET_VIEWS.ACCOUNT ? (
                      <Box
                        onClick={() => {
                          setWalletView(WALLET_VIEWS.ACCOUNT);
                        }}
                        css={{
                          cursor: "pointer",
                          color: "$white",
                        }}
                      >
                        <Box
                          as={ChevronLeftIcon}
                          css={{
                            alignSelf: "flex-start",
                            cursor: "pointer",
                            transform: "scale(1.6)",
                            color: "$white",
                          }}
                        />
                      </Box>
                    ) : (
                      "Connect To A Wallet"
                    )}
                  </Heading>
                </DialogTitle>
                <DialogClose asChild>
                  <Box
                    as={Cross1Icon}
                    css={{
                      alignSelf: "flex-start",
                      cursor: "pointer",
                      color: "$white",
                      width: 16,
                      height: 16,
                    }}
                  />
                </DialogClose>
              </Flex>
              <Box>
                {walletView === WALLET_VIEWS.PENDING ? (
                  <PendingView connector={pendingWallet} />
                ) : (
                  <Box css={{ display: "grid", gap: "$3", gridColumn: 1 }}>
                    {process.browser && getOptions()}
                  </Box>
                )}
              </Box>
            </Box>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

// Borrowed from uniswap's WalletModal component implementation
export default Index;
