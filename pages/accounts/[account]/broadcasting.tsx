import { getLayout } from "@layouts/main";
import AccountLayout from "@layouts/account";
import { getAccount, getGateways, getSortedOrchestrators } from "@lib/api/ssr";
import {
  AccountQueryResult,
  getApollo,
  OrchestratorsSortedQueryResult,
} from "apollo";
import { EnsIdentity } from "@lib/api/types/get-ens";

type PageProps = {
  account: AccountQueryResult["data"];
  sortedOrchestrators: OrchestratorsSortedQueryResult["data"];
  fallback: { [key: string]: EnsIdentity };
};

const BroadcastingPage = ({ account, sortedOrchestrators }: PageProps) => {
  return (
    <AccountLayout
      sortedOrchestrators={sortedOrchestrators}
      account={account}
    />
  );
};

BroadcastingPage.getLayout = getLayout;

export const getStaticPaths = async () => {
  const { gateways } = await getGateways();

  const paths =
    gateways?.data?.gateways?.map((g) => ({
      params: { account: g.id },
    })) ?? [];

  return {
    paths,
    fallback: "blocking",
  };
};

export const getStaticProps = async (context) => {
  try {
    const client = getApollo();
    const accountId = context.params?.account?.toString().toLowerCase();

    if (!accountId) {
      return { notFound: true };
    }

    const { account, fallback } = await getAccount(client, accountId);
    const { sortedOrchestrators, fallback: sortedOrchestratorsFallback } =
      await getSortedOrchestrators(client);

    if (!account.data?.gateway || !sortedOrchestrators.data) {
      return { notFound: true, revalidate: 300 };
    }

    const props: PageProps = {
      account: account.data,
      sortedOrchestrators: sortedOrchestrators.data,
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
    console.error(e);
  }

  return {
    notFound: true,
  };
};

export default BroadcastingPage;
