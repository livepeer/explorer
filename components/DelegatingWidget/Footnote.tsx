import { Box } from "@livepeer/design-system";

const Footnote = ({ children }) => {
  return (
    <Box
      css={{
        paddingTop: "$3",
        color: "gray",
        textAlign: "center",
        fontSize: "$1",
        lineHeight: 1.3,
      }}
    >
      {children}
    </Box>
  );
};

export default Footnote;
