import { getLayout } from "@layouts/main";
import AccountLayout from "@layouts/account";
import {
  AccountQueryResult,
  getApollo,
  OrchestratorsSortedQueryResult,
} from "apollo";
import { getAccount, getSortedOrchestrators } from "@lib/api/ssr";
import { GetStaticProps } from "next";
import { EnsIdentity } from "@lib/api/types/get-ens";

type PageProps = {
  account: AccountQueryResult["data"];
  sortedOrchestrators: OrchestratorsSortedQueryResult["data"];
  fallback: { [key: string]: EnsIdentity };
};

const Orchestrating = ({ account, sortedOrchestrators }: PageProps) => (
  <AccountLayout sortedOrchestrators={sortedOrchestrators} account={account} />
);

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

export const getStaticProps: GetStaticProps = async (context) => {
  try {
    const client = getApollo();
    const { account, fallback } = await getAccount(
      client,
      context.params?.account?.toString().toLowerCase()
    );

    const { sortedOrchestrators, fallback: sortedOrchestratorsFallback } =
      await getSortedOrchestrators(client);

    if (!account.data || !sortedOrchestrators.data) {
      return null;
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

  return null;
};

export default Orchestrating;
