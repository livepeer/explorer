import { Box, Flex } from "@livepeer/design-system";

export const statusCodes: { [code: number]: string } = {
  400: "Bad Request",
  405: "Method Not Allowed",
  500: "Internal Server Error",
};

const Index = ({ statusCode }: { statusCode: number }) => {
  return (
    <Flex
      css={{
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "$loContrast",
      }}
    >
      <Box
        css={{
          fontSize: "$5",
          paddingRight: "$4",
          marginRight: "$4",
          borderRight: "1px solid",
          borderColor: "$hiContrast",
        }}
      >
        {statusCode}
      </Box>
      <p>{statusCodes[statusCode] ?? "An unexpected error occurred"}</p>
    </Flex>
  );
};

export default Index;
