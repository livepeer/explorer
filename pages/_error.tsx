import ErrorComponent from "@components/Error";
function Error({ statusCode }) {
  return <ErrorComponent statusCode={statusCode} />;
}

Error.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default Error;
