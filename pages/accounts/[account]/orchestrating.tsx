import { getLayout } from "@layouts/main";
import AccountLayout from "@layouts/account";
import { getApollo } from "apollo";
import { getOrchestrator } from "@api/index";

const Orchestrating = () => <AccountLayout />;

Orchestrating.getLayout = getLayout;

export const getStaticPaths = async () => {
  return {
    paths: [], // no page needs be created at build time
    fallback: "blocking",
  };
};

export async function getStaticProps(context) {
  const client = getApollo();

  await getOrchestrator(
    client,
    context.params?.account?.toString().toLowerCase()
  );

  return {
    props: {
      initialApolloState: client.cache.extract(),
    },
    revalidate: 60,
  };
}

export default Orchestrating;
