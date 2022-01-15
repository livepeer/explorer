import { useQuery, gql } from "@apollo/client";
import { abbreviateNumber } from "../../lib/utils";
import { Box, Flex, Card } from "@livepeer/design-system";

const ProjectionBox = ({ action }) => {
  const GET_ROI = gql`
    {
      roi @client
      principle @client
    }
  `;

  const { data } = useQuery(GET_ROI);

  return (
    <Card
      css={{
        bc: "$neutral3",
        boxShadow: "$colors$neutral5 0px 0px 0px 1px inset",
        width: "100%",
        borderRadius: "$4",
        mb: "$3",
      }}
    >
      <Box css={{ px: "$3", py: "$3" }}>
        <Box>
          <Flex
            css={{
              fontSize: "$1",
              mb: "$3",
              justifyContent: "space-between",
            }}
          >
            <Box css={{ color: "$neutral11" }}>
              {action === "delegate"
                ? "Projected Rewards (1Y)"
                : "Projected Opportunity Cost (1Y)"}
            </Box>
            {action === "delegate" && (
              <Box css={{ fontFamily: "$monospace", color: "$neutral11" }}>
                +
                {data.principle
                  ? ((data.roi / +data.principle) * 100).toFixed(2) + "%"
                  : 0 + "%"}
              </Box>
            )}
          </Flex>
          <Flex css={{ justifyContent: "space-between", alignItems: "center" }}>
            <Box css={{ fontSize: "$5", fontFamily: "$monospace" }}>
              +{abbreviateNumber(data.roi)}
            </Box>
            <Box css={{ fontSize: "$2" }}>LPT</Box>
          </Flex>
        </Box>
      </Box>
    </Card>
  );
};

export default ProjectionBox;
