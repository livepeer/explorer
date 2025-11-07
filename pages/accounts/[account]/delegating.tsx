import { getSortedOrchestrators } from "@lib/api/ssr";

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

export const getStaticProps = async (context) => {
  try {
    return {
      props: {},
      revalidate: 600,
    };
  } catch (e) {
    console.error(e);
  }

  return null;
};

export default Delegating;
