import moment from "moment";
import { useTimeEstimate } from "core/hooks";
import { txMessages } from "../../lib/utils";
import { Box, Flex, Link as A } from "@livepeer/design-system";
import Spinner from "@components/Spinner";

const Index = ({ tx }) => {
  const { __typename, startTime, estimate, txHash } = tx;
  const { timeLeft } = useTimeEstimate({ startTime, estimate });

  if (!tx) {
    return null;
  }

  return (
    <Box css={{ position: "relative", px: "$4", pb: "$3", pt: "18px" }}>
      {/* <Box
        css={{
          position: "absolute",
          top: 0,
          left: 0,
          width: timeLeft
            ? `${((estimate - timeLeft) / estimate) * 100}%`
            : "0%",
          height: 4,
          background:
            "linear-gradient(260.35deg, #F1BC00 0.25%, #E926BE 47.02%, #9326E9 97.86%)",
        }}
      /> */}
      <Flex css={{ height: 42, alignItems: "center" }}>
        <Spinner css={{ mr: "$3", width: 20, height: 20 }} />
        {/* <Flex
          css={{
            mr: "$3",
            borderRadius: "100%",
            bg: "background",
            color: "white",
            minWidth: 42,
            minHeight: 42,
            justifyContent: "center",
            alignItems: "center",
            fontSize: "$1",
            fontWeight: "bold",
          }}
        >
          {timeLeft
            ? `${
                Math.floor(((estimate - timeLeft) / estimate) * 100) < 100
                  ? Math.floor(((estimate - timeLeft) / estimate) * 100)
                  : "100"
              }%`
            : "0%"}
        </Flex> */}
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
          {/* <Box css={{ fontSize: "$1", color: "$neutral11" }}>
            {timeLeft
              ? `⏳~${moment
                  .duration(timeLeft, "seconds")
                  .humanize()} remaining`
              : "⏳Calculating estimated confirmation duration..."}
          </Box> */}
        </Box>
        <A
          variant="primary"
          css={{ fontSize: "$1", justifySelf: "flex-end" }}
          target="_blank"
          rel="noopener noreferrer"
          href={`https://${
            process.env.NEXT_PUBLIC_NETWORK === "rinkeby" ? "rinkeby." : ""
          }etherscan.io/tx/${txHash}`}
        >
          Details
        </A>
      </Flex>
    </Box>
  );
};

export default Index;
