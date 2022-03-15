import { useRouter } from "next/router";
import { getLayout } from "@layouts/main";
import { useQuery } from "@apollo/client";
import Profile from "@components/Profile";
import DelegatingWidget from "@components/DelegatingWidget";
import Spinner from "@components/Spinner";
import { useWeb3React } from "@web3-react/core";
import { checkAddressEquality } from "@lib/utils";
import BottomDrawer from "@components/BottomDrawer";
import useWindowSize from "react-use/lib/useWindowSize";
import { usePageVisibility } from "../hooks";
import { useEffect } from "react";
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

const pollInterval = 5000;

export interface TabType {
  name: string;
  href: string;
  isActive?: boolean;
}

const AccountLayout = ({ children }) => {
  const context = useWeb3React();
  const { width } = useWindowSize();
  const isVisible = usePageVisibility();
  const router = useRouter();
  const { query, asPath } = router;

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
            pt: "$4",
            width: "100%",
            "@bp3": {
              pt: "$6",
              pr: "$7",
            },
          }}
        >
          <Profile
            account={query?.account.toString()}
            isMyAccount={isMyAccount}
            role={role}
            threeBoxSpace={threeBoxData?.threeBoxSpace}
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
                  <DelegatingWidget
                    transcoders={dataTranscoders.transcoders}
                    selectedAction="delegate"
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
                  <DelegatingWidget
                    transcoders={dataTranscoders.transcoders}
                    selectedAction="undelegate"
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
          {children}
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
              <DelegatingWidget
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
              <DelegatingWidget
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

AccountLayout.getLayout = getLayout;

export default AccountLayout;

function getTabs(
  role: string,
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
  if (role === "Orchestrator" || isMyDelegate) {
    tabs.unshift({
      name: "Orchestrating",
      href: `/accounts/${account}/orchestrating`,
      isActive: asPath === `/accounts/${account}/orchestrating`,
    });
  }

  return tabs;
}
