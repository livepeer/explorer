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

const Orchestrating = ({
  hadError,
  account,
  sortedOrchestrators,
}: PageProps) => {
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

Orchestrating.getLayout = getLayout;

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

    const { sortedOrchestrators, fallback: sortedOrchestratorsFallback } =
      await getSortedOrchestrators(client);

    if (!account.data || !sortedOrchestrators.data) {
      return { notFound: true, revalidate: 300 };
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

export default Orchestrating;
