const Delegating = () => <div>Test</div>;

export const getStaticPaths = async () => {
  return {
    paths: [],
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
