import { getSortedOrchestrators } from "@lib/api/ssr";
import { EnsIdentity } from "@lib/api/types/get-ens";
import { getApollo, OrchestratorsSortedQueryResult } from "apollo";

type PageProps = {
  // account: AccountQueryResult["data"] | null;
  sortedOrchestrators: OrchestratorsSortedQueryResult["data"];
  fallback: { [key: string]: EnsIdentity };
};

const Delegating = () => <div>Test</div>;

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

export const getStaticProps = async () => {
  try {
    const client = getApollo();
    // const { account, fallback } = await getAccount(
    //   client,
    //   context.params?.account?.toString().toLowerCase()
    // );

    const { sortedOrchestrators, fallback: sortedOrchestratorsFallback } =
      await getSortedOrchestrators(client);

    if (!sortedOrchestrators.data) {
      return { notFound: true, revalidate: 300 };
    }

    const props: PageProps = {
      // account: account.data,
      sortedOrchestrators: sortedOrchestrators.data,
      fallback: {
        ...sortedOrchestratorsFallback,
        // ...fallback,
      },
    };

    return {
      props,
      revalidate: 600,
    };
  } catch (e) {
    console.error(e);
  }

  return { notFound: true, revalidate: 300 };
};

export default Delegating;
