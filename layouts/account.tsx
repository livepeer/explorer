import { useRouter } from "next/router";
import { getLayout, LAYOUT_MAX_WIDTH } from "@layouts/main";
import { useQuery } from "@apollo/client";
import Profile from "@components/Profile";
import DelegatingWidget from "@components/DelegatingWidget";
import Spinner from "@components/Spinner";

import { checkAddressEquality } from "@lib/utils";
import BottomDrawer from "@components/BottomDrawer";
import useWindowSize from "react-use/lib/useWindowSize";
import { useAccountAddress, usePageVisibility } from "../hooks";
import { useEffect, useMemo } from "react";
import { accountQuery } from "../queries/accountQuery";
import { gql } from "@apollo/client";
import {
  Link as A,
  Flex,
  Container,
  Sheet,
  SheetTrigger,
  Button,
  SheetContent,
  Box,
} from "@livepeer/design-system";
import Link from "next/link";
import DelegatingView from "@components/DelegatingView";
import OrchestratingView from "@components/OrchestratingView";
import HistoryView from "@components/HistoryView";

const pollInterval = 5000;

export interface TabType {
  name: string;
  href: string;
  isActive?: boolean;
}

const ACCOUNT_VIEWS = ["delegating", "orchestrating", "history"];

const AccountLayout = () => {
  const accountAddress = useAccountAddress();
  const { width } = useWindowSize();
  const isVisible = usePageVisibility();
  const router = useRouter();
  const { query, asPath } = router;
  const view = ACCOUNT_VIEWS.find((v) => asPath.split("/")[3] === v);

  const { data: currentRoundData } = useQuery(gql`
    {
      protocol(id: "0") {
        id
        currentRound {
          id
        }
      }
    }
  `);

  const q = accountQuery(currentRoundData?.protocol.currentRound.id);

  const account = query?.account?.toString().toLowerCase();

  const {
    data,
    loading,
    startPolling: startPollingAccount,
    stopPolling: stopPollingAccount,
  } = useQuery(q, {
    variables: {
      account,
    },
    pollInterval,
  });

  const { data: dataTranscoders, loading: loadingTranscoders } = useQuery(
    gql`
      {
        transcoders(
          orderDirection: desc
          orderBy: totalStake
          where: { active: true }
        ) {
          id
          totalStake
        }
      }
    `
  );

  const {
    data: dataMyAccount,
    startPolling: startPollingMyAccount,
    stopPolling: stopPollingMyAccount,
  } = useQuery(q, {
    variables: {
      account: accountAddress?.toLowerCase(),
    },
    skip: !accountAddress,
    pollInterval,
  });

  useEffect(() => {
    if (!isVisible) {
      stopPollingMyAccount();
      stopPollingAccount();
    } else {
      startPollingMyAccount(pollInterval);
      startPollingAccount(pollInterval);
    }
  }, [
    isVisible,
    stopPollingMyAccount,
    stopPollingAccount,
    startPollingMyAccount,
    startPollingAccount,
  ]);

  const SELECTED_STAKING_ACTION = gql`
    {
      selectedStakingAction @client
    }
  `;
  const { data: selectedStakingAction } = useQuery(SELECTED_STAKING_ACTION);

  const isActive = useMemo(
    () => Boolean(data?.transcoder?.active),
    [data?.transcoder]
  );

  if (loading || loadingTranscoders) {
    return (
      <Flex
        css={{
          height: "calc(100vh - 100px)",
          width: "100%",
          justifyContent: "center",
          alignItems: "center",
          "@bp3": {
            height: "100vh",
          },
        }}
      >
        <Spinner />
      </Flex>
    );
  }

  const isMyAccount = checkAddressEquality(
    accountAddress,
    query?.account?.toString()
  );
  const isOrchestrator = data?.transcoder;
  const isMyDelegate =
    query?.account?.toString().toLowerCase() ===
    dataMyAccount?.delegator?.delegate?.id.toLowerCase();

  const tabs: Array<TabType> = getTabs(
    isOrchestrator,
    query?.account?.toString(),
    asPath,
    isMyDelegate
  );

  return (
    <Container css={{ maxWidth: LAYOUT_MAX_WIDTH, width: "100%" }}>
      <Flex>
        <Flex
          css={{
            flexDirection: "column",
            mb: "$6",
            pr: 0,
            pt: "$4",
            width: "100%",
            "@bp3": {
              pt: "$6",
              pr: "$7",
            },
          }}
        >
          <Profile
            isActive={isActive}
            account={query?.account.toString()}
            isMyAccount={isMyAccount}
            identity={data?.account?.identity}
          />
          <Flex
            css={{
              display: "flex",
              mb: "$4",
              "@bp3": {
                display: "none",
              },
            }}
          >
            {(isOrchestrator || isMyDelegate) && (
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="primary" css={{ mr: "$3" }} size="4">
                    Delegate
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" css={{ height: "initial" }}>
                  <DelegatingWidget
                    transcoders={dataTranscoders.transcoders}
                    selectedAction="delegate"
                    currentRound={data.protocol.currentRound}
                    delegator={dataMyAccount?.delegator}
                    account={dataMyAccount?.account}
                    transcoder={data.transcoder}
                    protocol={data.protocol}
                    delegateProfile={data?.account?.identity}
                  />
                </SheetContent>
              </Sheet>
            )}
            {isMyDelegate && (
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="red" size="4">
                    Undelegate
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" css={{ height: "initial" }}>
                  <DelegatingWidget
                    transcoders={dataTranscoders.transcoders}
                    selectedAction="undelegate"
                    currentRound={data.protocol.currentRound}
                    delegator={dataMyAccount?.delegator}
                    account={dataMyAccount?.account}
                    transcoder={data.transcoder}
                    protocol={data.protocol}
                    delegateProfile={data?.account?.identity}
                  />
                </SheetContent>
              </Sheet>
            )}
          </Flex>
          <Box
            css={{
              display: "flex",
              alignItems: "center",
              width: "100%",
              position: "relative",
              borderBottom: "1px solid",
              borderColor: "$neutral6",
            }}
          >
            {tabs.map((tab: TabType, i: number) => (
              <Link scroll={false} key={i} href={tab.href} passHref>
                <A
                  variant="subtle"
                  css={{
                    color: tab.isActive ? "$hiContrast" : "$neutral11",
                    mr: "$4",
                    pb: "$2",
                    fontSize: "$3",
                    fontWeight: 500,
                    borderBottom: "2px solid",
                    borderColor: tab.isActive ? "$primary11" : "transparent",
                    "&:hover": {
                      textDecoration: "none",
                    },
                  }}
                >
                  {tab.name}
                </A>
              </Link>
            ))}
          </Box>
          {view === "orchestrating" && (
            <OrchestratingView
              isActive={isActive}
              currentRound={data?.protocol?.currentRound}
              transcoder={data?.transcoder}
            />
          )}
          {view === "delegating" && (
            <DelegatingView
              transcoders={dataTranscoders.transcoders}
              delegator={data.delegator}
              protocol={data.protocol}
              currentRound={data.protocol.currentRound}
            />
          )}
          {view === "history" && <HistoryView />}
        </Flex>
        {(isOrchestrator || isMyDelegate) &&
          (width > 1020 ? (
            <Flex
              css={{
                display: "none",
                "@bp3": {
                  position: "sticky",
                  alignSelf: "flex-start",
                  top: "$9",
                  mt: "$6",
                  width: "40%",
                  display: "flex",
                },
              }}
            >
              <DelegatingWidget
                currentRound={data.protocol.currentRound}
                transcoders={dataTranscoders.transcoders}
                delegator={dataMyAccount?.delegator}
                account={dataMyAccount?.account}
                transcoder={data.transcoder}
                protocol={data.protocol}
                delegateProfile={data?.account?.identity}
              />
            </Flex>
          ) : (
            <BottomDrawer>
              <DelegatingWidget
                transcoders={dataTranscoders.transcoders}
                selectedAction={selectedStakingAction?.selectedStakingAction}
                currentRound={data.protocol.currentRound}
                delegator={dataMyAccount?.delegator}
                account={dataMyAccount?.account}
                transcoder={data.transcoder}
                protocol={data.protocol}
                delegateProfile={data?.account?.identity}
              />
            </BottomDrawer>
          ))}
      </Flex>
    </Container>
  );
};

AccountLayout.getLayout = getLayout;

export default AccountLayout;

function getTabs(
  isOrchestrator: boolean,
  account: string,
  asPath: string,
  isMyDelegate: boolean
): Array<TabType> {
  const tabs: Array<TabType> = [
    {
      name: "Delegating",
      href: `/accounts/${account}/delegating`,
      isActive: asPath === `/accounts/${account}/delegating`,
    },
    {
      name: "History",
      href: `/accounts/${account}/history`,
      isActive: asPath === `/accounts/${account}/history`,
    },
  ];
  if (isOrchestrator || isMyDelegate) {
    tabs.unshift({
      name: "Orchestrating",
      href: `/accounts/${account}/orchestrating`,
      isActive: asPath === `/accounts/${account}/orchestrating`,
    });
  }

  return tabs;
}
