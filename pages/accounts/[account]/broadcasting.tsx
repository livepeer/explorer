import ErrorComponent from "@components/Error";
import AccountLayout from "@layouts/account";
import { getLayout } from "@layouts/main";
import {
  getAccount,
  getGateways,
  getGatewaySelfRedeem,
  getSortedOrchestrators,
} from "@lib/api/ssr";
import { EnsIdentity } from "@lib/api/types/get-ens";
import {
  AccountQueryResult,
  getApollo,
  OrchestratorsSortedQueryResult,
} from "apollo";
import { isAddress } from "viem";

type PageProps = {
  hadError: boolean;
  account: AccountQueryResult["data"];
  sortedOrchestrators: OrchestratorsSortedQueryResult["data"];
  isSelfRedeeming: boolean;
  fallback: { [key: string]: EnsIdentity };
};

const BroadcastingPage = ({
  hadError,
  account,
  sortedOrchestrators,
  isSelfRedeeming,
}: PageProps) => {
  if (hadError) {
    return <ErrorComponent statusCode={500} />;
  }

  return (
    <AccountLayout
      sortedOrchestrators={sortedOrchestrators}
      account={account}
      isSelfRedeeming={isSelfRedeeming}
    />
  );
};

BroadcastingPage.getLayout = getLayout;

export const getStaticPaths = async () => {
  const { gateways } = await getGateways();

  return {
    paths:
      gateways?.data?.gateways?.map((g) => ({
        params: { account: g.id },
      })) ?? [],
    fallback: "blocking",
  };
};

export const getStaticProps = async (context: {
  params: { account: string };
}) => {
  try {
    const accountId = context.params?.account?.toString().toLowerCase();

    // 404 only on malformed addresses; a valid address with no on-chain activity still
    // renders the empty-state account page.
    if (!accountId || !isAddress(accountId)) {
      return { notFound: true };
    }

    const client = getApollo();
    const { account, fallback } = await getAccount(client, accountId);

    // If we couldn't fetch account data, treat it as a temporary error
    if (!account.data) {
      throw new Error("Failed to fetch account data");
    }

    const { sortedOrchestrators, fallback: sortedOrchestratorsFallback } =
      await getSortedOrchestrators(client);

    // If we couldn't fetch orchestrators data, treat it as a temporary error
    if (!sortedOrchestrators.data) {
      throw new Error("Failed to fetch orchestrators data");
    }

    const isSelfRedeeming = await getGatewaySelfRedeem(client, accountId);

    const props: PageProps = {
      hadError: false,
      account: account.data,
      sortedOrchestrators: sortedOrchestrators.data,
      isSelfRedeeming,
      fallback: {
        ...sortedOrchestratorsFallback,
        ...fallback,
      },
    };

    return {
      props,
      revalidate: 600,
    };
  } catch (e) {
    console.log(e);
    return {
      props: {
        hadError: true,
      },
      revalidate: 60,
    };
  }
};

export default BroadcastingPage;
