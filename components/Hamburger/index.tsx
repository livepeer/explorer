import { Box, Flex } from "@livepeer/design-system";

const Index = ({ ...props }) => {
  return (
    <Flex
      css={{
        cursor: "pointer",
        flexDirection: "column",
        justifyContent: "center",
        marginRight: "$3",
      }}
      {...props}
    >
      <Box
        css={{
          marginBottom: "5px",
          backgroundColor: "$hiContrast",
          height: "1px",
          width: "20px",
        }}
      />
      <Box
        css={{
          marginBottom: "5px",
          backgroundColor: "$hiContrast",
          height: "1px",
          width: "16px",
        }}
      />
      <Box
        css={{ backgroundColor: "$hiContrast", height: "1px", width: "20px" }}
      />
    </Flex>
  );
};

export default Index;
