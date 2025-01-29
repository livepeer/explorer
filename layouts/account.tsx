import DelegatingWidget from "@components/DelegatingWidget";
import { bondingManager } from "@lib/api/abis/main/BondingManager";
import Profile from "@components/Profile";
import { getLayout, LAYOUT_MAX_WIDTH } from "@layouts/main";
import { useRouter } from "next/router";
import { useBondingManagerAddress } from "hooks/useContracts";
import { useContractRead } from "wagmi";

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
  Link as LivepeerLink,
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@jjasonn.stone/design-system";
import {
  AccountQueryResult,
  OrchestratorsSortedQueryResult,
  useAccountQuery,
} from "apollo";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useWindowSize } from "react-use";
import { useAccountAddress, useEnsData, useExplorerStore } from "../hooks";

export interface TabType {
  name: string;
  href: string;
  isActive?: boolean;
}

type TabTypeEnum = "delegating" | "orchestrating" | "history";

const ACCOUNT_VIEWS: TabTypeEnum[] = ["delegating", "orchestrating", "history"];

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

  const { setSelectedStakingAction, latestTransaction } = useExplorerStore();

  const accountId = useMemo(
    () => query?.account?.toString().toLowerCase(),
    [query]
  );

  const identity = useEnsData(accountId);
  const myIdentity = useEnsData(accountAddress);

  const [pollInterval, setPollInterval] = useState<number | undefined>(
    undefined
  );

  const { data: dataMyAccount } = useAccountQuery({
    variables: {
      account: accountAddress?.toLowerCase() ?? "",
    },
    skip: !accountAddress,
    pollInterval,
  });

  const { data: bondingManagerAddress } = useBondingManagerAddress(); 
  const { data: treasuryRewardCutRate = BigInt(0.0) } = useContractRead({
    enabled: Boolean(bondingManagerAddress),
    address: bondingManagerAddress,
    abi: bondingManager,
    functionName: "treasuryRewardCutRate",
  });
  const treasury = {
    treasuryRewardCutRate: Number(treasuryRewardCutRate / BigInt(1e18)) / 1e9,
  };

  // start polling when when transactions finish
  useEffect(() => {
    if (latestTransaction?.step === "confirmed") {
      setPollInterval(5000);
    }
  }, [latestTransaction?.step]);

  const isActive = useMemo(
    () => Boolean(account?.transcoder?.active),
    [account?.transcoder]
  );

  const isMyAccount = useMemo(
    () => checkAddressEquality(accountAddress ?? "", accountId ?? ""),
    [accountAddress, accountId]
  );
  const isOrchestrator = useMemo(() => Boolean(account?.transcoder), [account]);
  const isMyDelegate = useMemo(
    () => accountId === dataMyAccount?.delegator?.delegate?.id.toLowerCase(),
    [accountId, dataMyAccount]
  );

  const isDelegatingAndIsMyAccountView = useMemo(
    () =>
      dataMyAccount?.delegator?.bondedAmount !== "0" &&
      accountId === dataMyAccount?.delegator?.id.toLowerCase(),
    [accountId, dataMyAccount]
  );

  const tabs: Array<TabType> = useMemo(
    () =>
      getTabs(
        isOrchestrator,
        accountId ?? "",
        view ?? "delegating",
        isMyDelegate
      ),
    [isOrchestrator, accountId, view, isMyDelegate]
  );

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
            account={query?.account?.toString() ?? ""}
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
            {/*
              The delegation widget should only be displayed on the account page
              under the following conditions:
              a) the account page belongs to an orchestrator
              b) the account page belongs to a deactivated orchestrator I am still delegated to
              c) the account page belongs to me and I am a delegator
            */}
            {(isOrchestrator ||
              isMyDelegate ||
              isDelegatingAndIsMyAccountView) && (
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="primary"
                    css={{ mr: "$3" }}
                    size="4"
                    onClick={(event) => {
                      event.stopPropagation();
                      setSelectedStakingAction("delegate");
                    }}
                  >
                    Delegate
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" css={{ height: "initial" }}>
                  <DelegatingWidget
                    transcoders={sortedOrchestrators?.transcoders as any}
                    delegator={dataMyAccount?.delegator}
                    account={myIdentity}
                    transcoder={
                      isDelegatingAndIsMyAccountView
                        ? dataMyAccount?.delegator?.delegate
                        : account?.transcoder
                    }
                    protocol={account?.protocol}
                    treasury={treasury}
                    delegateProfile={identity}
                  />
                </SheetContent>
              </Sheet>
            )}
            {isMyDelegate ||
              (isDelegatingAndIsMyAccountView && (
                <Sheet>
                  <SheetTrigger asChild>
                    <Button
                      variant="red"
                      size="4"
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelectedStakingAction("undelegate");
                      }}
                    >
                      Undelegate
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="bottom" css={{ height: "initial" }}>
                    <DelegatingWidget
                      transcoders={sortedOrchestrators?.transcoders}
                      delegator={dataMyAccount?.delegator}
                      account={myIdentity}
                      transcoder={
                        isDelegatingAndIsMyAccountView
                          ? dataMyAccount?.delegator?.delegate
                          : account?.transcoder
                      }
                      protocol={account?.protocol}
                      treasury={treasury}
                      delegateProfile={identity}
                    />
                  </SheetContent>
                </Sheet>
              ))}
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
              <Link
                scroll={false}
                key={i}
                href={tab.href}
                passHref
                legacyBehavior
              >
                <LivepeerLink
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
                </LivepeerLink>
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
              transcoders={sortedOrchestrators?.transcoders}
              delegator={account?.delegator}
              protocol={account?.protocol}
              currentRound={account?.protocol?.currentRound}
            />
          )}
          {view === "history" && <HistoryView />}
        </Flex>
        {(isOrchestrator || isMyDelegate || isDelegatingAndIsMyAccountView) &&
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
                transcoders={sortedOrchestrators?.transcoders}
                delegator={dataMyAccount?.delegator}
                account={myIdentity}
                transcoder={
                  isDelegatingAndIsMyAccountView
                    ? dataMyAccount?.delegator?.delegate
                    : account?.transcoder
                }
                protocol={account?.protocol}
                treasury={treasury}
                delegateProfile={identity}
              />
            </Flex>
          ) : (
            <BottomDrawer>
              <DelegatingWidget
                transcoders={sortedOrchestrators?.transcoders}
                delegator={dataMyAccount?.delegator}
                account={myIdentity}
                transcoder={
                  isDelegatingAndIsMyAccountView
                    ? dataMyAccount?.delegator?.delegate
                    : account?.transcoder
                }
                protocol={account?.protocol}
                treasury={treasury}
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
  view: TabTypeEnum,
  isMyDelegate: boolean
): Array<TabType> {
  const tabs: Array<TabType> = [
    {
      name: "Delegating",
      href: `/accounts/${account}/delegating`,
      isActive: view === "delegating",
    },
    {
      name: "History",
      href: `/accounts/${account}/history`,
      isActive: view === "history",
    },
  ];
  if (isOrchestrator || isMyDelegate) {
    tabs.unshift({
      name: "Orchestrating",
      href: `/accounts/${account}/orchestrating`,
      isActive: view === "orchestrating",
    });
  }

  return tabs;
}
