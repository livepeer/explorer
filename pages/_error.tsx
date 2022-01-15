import { Box, Flex } from "@livepeer/design-system";

const statusCodes: { [code: number]: string } = {
  400: "Bad Request",
  405: "Method Not Allowed",
  500: "Internal Server Error",
};

function Error({ statusCode }) {
  return (
    <Flex
      css={{
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
        bc: "$loContrast",
      }}
    >
      <Box
        css={{
          fontSize: "$5",
          pr: "$4",
          mr: "$4",
          borderRight: "1px solid",
          borderColor: "$hiContrast",
        }}
      >
        {statusCode}
      </Box>
      <p>{statusCodes[statusCode]}</p>
    </Flex>
  );
}

Error.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default Error;
