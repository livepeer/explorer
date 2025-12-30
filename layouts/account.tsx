import BottomDrawer from "@components/BottomDrawer";
import DelegatingView from "@components/DelegatingView";
import DelegatingWidget from "@components/DelegatingWidget";
import HistoryView from "@components/HistoryView";
import HorizontalScrollContainer from "@components/HorizontalScrollContainer";
import OrchestratingView from "@components/OrchestratingView";
import Profile from "@components/Profile";
import Spinner from "@components/Spinner";
import { LAYOUT_MAX_WIDTH } from "@layouts/constants";
import { getLayout } from "@layouts/main";
import { bondingManager } from "@lib/api/abis/main/BondingManager";
import { getAccount, getSortedOrchestrators } from "@lib/api/ssr";
import { checkAddressEquality } from "@lib/utils";
import {
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
  getApollo,
  OrchestratorsSortedQueryResult,
  useAccountQuery,
} from "apollo";
import { useBondingManagerAddress } from "hooks/useContracts";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { useWindowSize } from "react-use";
import useSWR from "swr";
import { useReadContract } from "wagmi";

import { useAccountAddress, useEnsData, useExplorerStore } from "../hooks";

export interface TabType {
  name: string;
  href: string;
  isActive?: boolean;
}

type TabTypeEnum = "delegating" | "orchestrating" | "history";

const ACCOUNT_VIEWS: TabTypeEnum[] = ["delegating", "orchestrating", "history"];

const AccountLayout = () => {
  /* PART OF https://github.com/livepeer/explorer/pull/427 - TODO: REMOVE ONCE SERVER-SIDE ISSUE IS FIXED */
  const context = { params: useParams() };

  const {
    data: sortedOrchestrators,
    error: errorSortedOrchestrators,
    isLoading: isLoadingSortedOrchestrators,
  } = useSWR<OrchestratorsSortedQueryResult["data"]>(
    `/api/ssr/sorted-orchestrators`,
    async () => {
      const { sortedOrchestrators } = await getSortedOrchestrators();
      return sortedOrchestrators.data as OrchestratorsSortedQueryResult["data"];
    }
  );

  const {
    data: account,
    error: errorAccount,
    isLoading: isLoadingAccount,
  } = useSWR<AccountQueryResult["data"]>(
    `/api/ssr/account/${context.params?.account?.toString().toLowerCase()}`,
    async () => {
      const client = getApollo();
      const { account } = await getAccount(
        client,
        context.params?.account?.toString().toLowerCase() ?? ""
      );
      return account.data;
    }
  );

  /* ************* */

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
  const { data: treasuryRewardCutRate = BigInt(0.0) } = useReadContract({
    query: { enabled: Boolean(bondingManagerAddress) },
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

  /* PART OF https://github.com/livepeer/explorer/pull/427 - TODO: REMOVE ONCE SERVER-SIDE ISSUE IS FIXED */
  if (isLoadingSortedOrchestrators || isLoadingAccount) {
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

  if (errorSortedOrchestrators || errorAccount) {
    // TODO: Replace with ErrorComponent once https://github.com/livepeer/explorer/pull/435 is merged
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
        An error occurred while loading account data.
      </Flex>
    );
  }
  /* ************* */

  return (
    <Container css={{ maxWidth: LAYOUT_MAX_WIDTH, width: "100%" }}>
      <Flex>
        <Flex
          css={{
            flexDirection: "column",
            marginBottom: "$6",
            paddingRight: 0,
            paddingTop: "$4",
            width: "100%",
            "@bp3": {
              paddingTop: "$6",
              paddingRight: "$7",
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
              marginBottom: "$4",
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
                    css={{ marginRight: "$3" }}
                    size="4"
                    onClick={(event) => {
                      event.stopPropagation();
                      setSelectedStakingAction("delegate");
                    }}
                  >
                    Delegate
                  </Button>
                </SheetTrigger>
                <SheetContent
                  css={{ height: "initial" }}
                  onPointerEnterCapture={undefined}
                  onPointerLeaveCapture={undefined}
                  placeholder={undefined}
                  side="bottom"
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
                  <SheetContent
                    side="bottom"
                    css={{ height: "initial" }}
                    placeholder={undefined}
                    onPointerEnterCapture={undefined}
                    onPointerLeaveCapture={undefined}
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
                  </SheetContent>
                </Sheet>
              ))}
          </Flex>
          <HorizontalScrollContainer
            role="navigation"
            ariaLabel="Account navigation tabs"
          >
            {tabs.map((tab: TabType, i: number) => (
              <A
                as={Link}
                scroll={false}
                key={i}
                href={tab.href}
                passHref
                variant="subtle"
                data-active={tab.isActive ? "true" : undefined}
                aria-current={tab.isActive ? "page" : undefined}
                css={{
                  color: tab.isActive ? "$hiContrast" : "$neutral11",
                  marginRight: "$4",
                  paddingBottom: "$2",
                  fontSize: "$3",
                  fontWeight: 500,
                  flex: "0 0 auto",
                  whiteSpace: "nowrap",
                  borderBottom: "2px solid",
                  borderColor: tab.isActive ? "$primary11" : "transparent",
                  "&:hover": {
                    textDecoration: "none",
                  },
                }}
              >
                {tab.name}
              </A>
            ))}
          </HorizontalScrollContainer>
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
                  marginTop: "$6",
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
