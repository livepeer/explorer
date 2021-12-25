import { useRouter } from "next/router";
import { getLayout } from "@layouts/main";
import { useQuery } from "@apollo/client";
import Tabs, { TabType } from "@components/Tabs";
import Profile from "@components/Profile";
import StakingWidget from "@components/StakingWidget";
import CampaignView from "@components/CampaignView";
import StakingView from "@components/StakingView";
import Spinner from "@components/Spinner";
import { useWeb3React } from "@web3-react/core";
import { checkAddressEquality } from "@lib/utils";
import HistoryView from "@components/HistoryView";
import BottomDrawer from "@components/BottomDrawer";
import useWindowSize from "react-use/lib/useWindowSize";
import { usePageVisibility } from "../../../hooks";
import { useEffect } from "react";
import { accountQuery } from "core/queries/accountQuery";
import { gql } from "@apollo/client";
import { NextPage } from "next";
import {
  Flex,
  Container,
  Sheet,
  SheetTrigger,
  Button,
  SheetContent,
} from "@livepeer/design-system";

const pollInterval = 5000;

const Account = () => {
  const context = useWeb3React();
  const { width } = useWindowSize();
  const isVisible = usePageVisibility();
  const router = useRouter();
  const { query, asPath } = router;
  const slug = query.slug;

  const { data: currentRoundData } = useQuery(gql`
    {
      protocol(id: "0") {
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
    refetch,
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
      account: context?.account?.toLowerCase(),
    },
    skip: !context?.active,
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

  const { data: threeBoxData } = useQuery(
    gql`
      {
        threeBoxSpace(id: "${query?.account}") {
          __typename
          id
          did
          name
          website
          description
          image
          addressLinks
          defaultProfile
        }
      }
    `
  );

  const { data: delegateProfile } = useQuery(
    gql`
      {
        threeBoxSpace(id: "${data?.delegator?.delegate?.id}") {
          __typename
          name
        }
      }
    `
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
    context?.account,
    query?.account?.toString()
  );
  const isOrchestrator = data?.transcoder;
  const isMyDelegate =
    query?.account?.toString() === dataMyAccount?.delegator?.delegate?.id;

  let role: string;

  if (isOrchestrator || isMyDelegate) {
    role = "Orchestrator";
  } else if (+data?.delegator?.bondedAmount > 0) {
    role = "Delegator";
  }

  const tabs: Array<TabType> = getTabs(
    role,
    query?.account?.toString(),
    asPath,
    isMyDelegate
  );

  return (
    <Container size="3" css={{ width: "100%" }}>
      <Flex>
        <Flex
          css={{
            flexDirection: "column",
            mb: "$6",
            pr: 0,
            pt: "$2",
            width: "100%",
            "@bp3": {
              pt: "$6",
              pr: "$7",
            },
          }}
        >
          <Profile
            account={query?.account.toString()}
            delegator={data.delegator}
            isMyDelegate={isMyDelegate}
            isMyAccount={isMyAccount}
            refetch={refetch}
            role={role}
            transcoder={data.transcoder}
            threeBoxSpace={threeBoxData?.threeBoxSpace}
            currentRound={data.protocol.currentRound}
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
            {(role === "Orchestrator" || isMyDelegate) && (
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="primary" css={{ mr: "$3" }} size="4">
                    Delegate
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" css={{ height: "initial" }}>
                  <StakingWidget
                    transcoders={dataTranscoders.transcoders}
                    selectedAction="stake"
                    currentRound={data.protocol.currentRound}
                    delegator={dataMyAccount?.delegator}
                    account={dataMyAccount?.account}
                    transcoder={data.transcoder}
                    protocol={data.protocol}
                    delegateProfile={delegateProfile?.threeBoxSpace}
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
                  <StakingWidget
                    transcoders={dataTranscoders.transcoders}
                    selectedAction="unstake"
                    currentRound={data.protocol.currentRound}
                    delegator={dataMyAccount?.delegator}
                    account={dataMyAccount?.account}
                    transcoder={data.transcoder}
                    protocol={data.protocol}
                    delegateProfile={delegateProfile?.threeBoxSpace}
                  />
                </SheetContent>
              </Sheet>
            )}
          </Flex>
          <Tabs tabs={tabs} />
          {slug === "orchestrating" && (
            <CampaignView
              currentRound={data.protocol.currentRound}
              transcoder={data.transcoder}
            />
          )}
          {/* {slug === "fees" && (
            <FeesView delegator={data.delegator} isMyAccount={isMyAccount} />
          )} */}
          {slug === "delegating" && (
            <StakingView
              transcoders={dataTranscoders.transcoders}
              delegator={data.delegator}
              protocol={data.protocol}
              delegateProfile={delegateProfile?.threeBoxSpace}
              currentRound={data.protocol.currentRound}
            />
          )}
          {slug === "history" && <HistoryView />}
        </Flex>
        {(role === "Orchestrator" || isMyDelegate) &&
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
              <StakingWidget
                currentRound={data.protocol.currentRound}
                transcoders={dataTranscoders.transcoders}
                delegator={dataMyAccount?.delegator}
                account={dataMyAccount?.account}
                transcoder={data.transcoder}
                protocol={data.protocol}
                delegateProfile={delegateProfile?.threeBoxSpace}
              />
            </Flex>
          ) : (
            <BottomDrawer>
              <StakingWidget
                transcoders={dataTranscoders.transcoders}
                selectedAction={selectedStakingAction?.selectedStakingAction}
                currentRound={data.protocol.currentRound}
                delegator={dataMyAccount?.delegator}
                account={dataMyAccount?.account}
                transcoder={data.transcoder}
                protocol={data.protocol}
                delegateProfile={delegateProfile?.threeBoxSpace}
              />
            </BottomDrawer>
          ))}
      </Flex>
    </Container>
  );
};

Account.getLayout = getLayout;

export default Account;

function getTabs(
  role: string,
  account: string,
  asPath: string,
  isMyDelegate: boolean
): Array<TabType> {
  const tabs: Array<TabType> = [
    {
      name: "Delegating",
      href: "/accounts/[account]/[slug]",
      as: `/accounts/${account}/delegating`,
      isActive: asPath === `/accounts/${account}/delegating`,
    },
    {
      name: "History",
      href: "/accounts/[account]/[slug]",
      as: `/accounts/${account}/history`,
      isActive: asPath === `/accounts/${account}/history`,
    },
  ];
  if (role === "Orchestrator" || isMyDelegate) {
    tabs.unshift({
      name: "Orchestrating",
      href: "/accounts/[account]/[slug]",
      as: `/accounts/${account}/orchestrating`,
      isActive: asPath === `/accounts/${account}/orchestrating`,
    });
  }

  return tabs;
}
