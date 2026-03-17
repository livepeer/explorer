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
    const client = getApollo();
    const accountId = context.params?.account?.toString().toLowerCase();

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

    // Only return 404 if the account truly doesn't exist
    // (no delegator AND no transcoder AND no gateway)
    if (
      !account.data?.delegator &&
      !account.data?.transcoder &&
      !account.data?.gateway
    ) {
      return { notFound: true };
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
