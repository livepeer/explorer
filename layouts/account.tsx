import DelegatingWidget from "@components/DelegatingWidget";
import Profile from "@components/Profile";
import { getLayout, LAYOUT_MAX_WIDTH } from "@layouts/main";
import { useRouter } from "next/router";

import BottomDrawer from "@components/BottomDrawer";
import DelegatingView from "@components/DelegatingView";
import HistoryView from "@components/HistoryView";
import OrchestratingView from "@components/OrchestratingView";
import { checkAddressEquality } from "@lib/utils";
import {
  Box,
  Button,
  Container,
  Flex,
  Link as A,
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@livepeer/design-system";
import {
  AccountQueryResult,
  OrchestratorsSortedQueryResult,
  useAccountQuery,
} from "apollo";
import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useWindowSize } from "react-use";
import { useAccountAddress, useEnsData, useExplorerStore } from "../hooks";

export interface TabType {
  name: string;
  href: string;
  isActive?: boolean;
}

const ACCOUNT_VIEWS = ["delegating", "orchestrating", "history"] as const;

const AccountLayout = ({
  account,
  sortedOrchestrators,
}: {
  account?: AccountQueryResult["data"] | null;
  sortedOrchestrators: OrchestratorsSortedQueryResult["data"];
}) => {
  const accountAddress = useAccountAddress();
  const { width } = useWindowSize();
  const router = useRouter();
  const { query, asPath } = router;
  const view = useMemo(
    () => ACCOUNT_VIEWS.find((v) => asPath.split("/")[3] === v),
    [asPath]
  );

  const accountId = useMemo(
    () => query?.account?.toString().toLowerCase(),
    [query]
  );

  const identity = useEnsData(accountId);
  const myIdentity = useEnsData(accountAddress);

  const { data: dataMyAccount } = useAccountQuery({
    variables: {
      account: accountAddress?.toLowerCase(),
    },
    skip: !accountAddress,
  });

  const isActive = useMemo(
    () => Boolean(account?.transcoder?.active),
    [account?.transcoder]
  );

  const isMyAccount = useMemo(
    () => checkAddressEquality(accountAddress, accountId),
    [accountAddress, accountId]
  );
  const isOrchestrator = useMemo(() => Boolean(account?.transcoder), [account]);
  const isMyDelegate = useMemo(
    () => accountId === dataMyAccount?.delegator?.delegate?.id.toLowerCase(),
    [accountId, dataMyAccount]
  );

  const tabs: Array<TabType> = useMemo(
    () => getTabs(isOrchestrator, accountId, asPath, isMyDelegate),
    [isOrchestrator, accountId, asPath, isMyDelegate]
  );

  const { setSelectedStakingAction } = useExplorerStore();

  useEffect(() => {
    setSelectedStakingAction("delegate");
  }, [setSelectedStakingAction]);

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
            identity={identity}
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
                    transcoders={sortedOrchestrators.transcoders}
                    delegator={dataMyAccount?.delegator}
                    account={myIdentity}
                    transcoder={account?.transcoder}
                    protocol={account?.protocol}
                    delegateProfile={identity}
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
                    transcoders={sortedOrchestrators.transcoders}
                    delegator={dataMyAccount?.delegator}
                    account={myIdentity}
                    transcoder={account.transcoder}
                    protocol={account.protocol}
                    delegateProfile={identity}
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
              currentRound={account?.protocol?.currentRound}
              transcoder={account?.transcoder}
            />
          )}
          {view === "delegating" && (
            <DelegatingView
              transcoders={sortedOrchestrators.transcoders}
              delegator={account?.delegator}
              protocol={account?.protocol}
              currentRound={account.protocol.currentRound}
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
                transcoders={sortedOrchestrators.transcoders}
                delegator={dataMyAccount?.delegator}
                account={myIdentity}
                transcoder={account?.transcoder}
                protocol={account?.protocol}
                delegateProfile={identity}
              />
            </Flex>
          ) : (
            <BottomDrawer>
              <DelegatingWidget
                transcoders={sortedOrchestrators.transcoders}
                delegator={dataMyAccount?.delegator}
                account={myIdentity}
                transcoder={account?.transcoder}
                protocol={account?.protocol}
                delegateProfile={identity}
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
