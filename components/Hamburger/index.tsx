import { Box, Flex } from "@livepeer/design-system";

const Index = ({ ...props }) => {
  return (
    <Flex
      css={{
        cursor: "pointer",
        flexDirection: "column",
        justifyContent: "center",
        mr: "$3",
      }}
      {...props}
    >
      <Box
        css={{ mb: "5px", bc: "$hiContrast", height: "1px", width: "20px" }}
      />
      <Box
        css={{ mb: "5px", bc: "$hiContrast", height: "1px", width: "16px" }}
      />
      <Box css={{ bc: "$hiContrast", height: "1px", width: "20px" }} />
    </Flex>
  );
};

export default Index;
