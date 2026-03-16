import ErrorComponent from "@components/Error";
import AccountLayout from "@layouts/account";
import { getLayout } from "@layouts/main";
import { getAccount, getSortedOrchestrators } from "@lib/api/ssr";
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
  fallback: { [key: string]: EnsIdentity };
};

const History = ({ hadError, account, sortedOrchestrators }: PageProps) => {
  if (hadError) {
    return <ErrorComponent statusCode={500} />;
  }

  return (
    <AccountLayout
      sortedOrchestrators={sortedOrchestrators}
      account={account}
    />
  );
};

History.getLayout = getLayout;

export const getStaticPaths = async () => {
  const { sortedOrchestrators } = await getSortedOrchestrators();

  return {
    paths:
      sortedOrchestrators?.data?.transcoders?.map((t) => ({
        params: { account: t.id },
      })) ?? [],
    fallback: "blocking",
  };
};

export const getStaticProps = async (context: {
  params: { account: string };
}) => {
  try {
    const client = getApollo();
    const { account, fallback } = await getAccount(
      client,
      context.params?.account?.toString().toLowerCase()
    );

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

    // Only return 404 if the account truly doesn't exist (no delegator AND no transcoder)
    // Don't cache 404s to avoid stale 404 responses from transient failures
    if (!account.data?.delegator && !account.data?.transcoder) {
      return { notFound: true };
    }

    const props: PageProps = {
      hadError: false,
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
    console.log(e);
    return {
      props: {
        hadError: true,
      },
      revalidate: 60,
    };
  }
};

export default History;
