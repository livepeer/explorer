import { txMessages } from "../../lib/utils";
import { Box, Flex, Link as A } from "@livepeer/design-system";
import Spinner from "@components/Spinner";
import { CHAIN_INFO, DEFAULT_CHAIN_ID } from "lib/chains";

const Index = ({ tx }) => {
  const { __typename, txHash } = tx;

  if (!tx) {
    return null;
  }

  return (
    <Box css={{ position: "relative", px: "$4", pb: "$3", pt: "18px" }}>
      <Flex css={{ height: 42, alignItems: "center" }}>
        <Spinner css={{ mr: "$3", width: 20, height: 20 }} />
        <Box css={{ width: "100%" }}>
          <Box
            css={{
              mb: "4px",
              color: "$hiContrast",
              fontSize: "$2",
              fontWeight: "bold",
            }}
          >
            {txMessages[__typename]?.pending}
          </Box>
        </Box>
        <A
          variant="primary"
          css={{ fontSize: "$1", justifySelf: "flex-end" }}
          target="_blank"
          rel="noopener noreferrer"
          href={`${CHAIN_INFO[DEFAULT_CHAIN_ID].explorer}tx/${txHash}`}
        >
          Details
        </A>
      </Flex>
    </Box>
  );
};

export default Index;
