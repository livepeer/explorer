import { getLayout } from "@layouts/main";
import AccountLayout from "@layouts/account";
import { AccountQueryResult, getApollo } from "apollo";
import { getOrchestrator } from "@api/index";
import { GetStaticProps } from "next";
import { EnsIdentity } from "@api/types/get-ens";

type PageProps = {
  orchestrator: AccountQueryResult["data"];
  fallback: { [key: string]: EnsIdentity };
};

const Orchestrating = ({ orchestrator }: PageProps) => (
  <AccountLayout orchestrator={orchestrator} />
);

Orchestrating.getLayout = getLayout;

export const getStaticPaths = async () => {
  return {
    paths: [], // no page needs be created at build time
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

    if (!orchestrator.data) {
      return { notFound: true };
    }

    const props: PageProps = {
      // initialApolloState: client.cache.extract(),
      orchestrator: orchestrator.data,
      fallback,
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

export default Orchestrating;
