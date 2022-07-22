import { getLayout } from "@layouts/main";
import AccountLayout from "@layouts/account";
import {
  AccountQueryResult,
  getApollo,
  OrchestratorsSortedQueryResult,
} from "apollo";
import { getOrchestrator, getSortedOrchestrators } from "@lib/api/ssr";
import { GetStaticProps } from "next";
import { EnsIdentity } from "@lib/api/types/get-ens";

type PageProps = {
  orchestrator: AccountQueryResult["data"];
  sortedOrchestrators: OrchestratorsSortedQueryResult["data"];
  fallback: { [key: string]: EnsIdentity };
};

const Delegating = ({ orchestrator, sortedOrchestrators }: PageProps) => (
  <AccountLayout
    sortedOrchestrators={sortedOrchestrators}
    orchestrator={orchestrator}
  />
);

Delegating.getLayout = getLayout;

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
    const { orchestrator, fallback } = await getOrchestrator(
      client,
      context.params?.account?.toString().toLowerCase()
    );

    const { sortedOrchestrators, fallback: sortedOrchestratorsFallback } =
      await getSortedOrchestrators(client);

    if (!orchestrator.data || !sortedOrchestrators.data) {
      return { notFound: true };
    }

    const props: PageProps = {
      orchestrator: orchestrator.data,
      sortedOrchestrators: sortedOrchestrators.data,
      fallback: {
        ...sortedOrchestratorsFallback,
        ...fallback,
      },
    };

    return {
      props,
      revalidate: 60,
    };
  } catch (e) {
    console.error(e);
  }

  return { notFound: true };
};

export default Delegating;
