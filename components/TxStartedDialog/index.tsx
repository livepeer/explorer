import { useTimeEstimate } from "../../hooks";
import { txMessages } from "../../lib/utils";
import Utils from "web3-utils";
import moment from "moment";
import Spinner from "../Spinner";
import { ExternalLinkIcon } from "@modulz/radix-icons";
import {
  Box,
  Flex,
  Button,
  Dialog,
  DialogClose,
  DialogTitle,
  DialogContent,
  Heading,
  Badge,
  Link as A,
} from "@livepeer/design-system";

const Index = ({ tx, isOpen, onDismiss }) => {
  const { timeLeft } = useTimeEstimate({
    startTime: tx?.startTime,
    estimate: tx?.estimate,
  });

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onDismiss();
        }
      }}
    >
      <DialogTitle asChild>
        <Heading
          size="1"
          css={{
            mb: "$4",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          Sending
          <Badge
            variant="primary"
            size="1"
            css={{ display: "flex", alignItems: "center" }}
          >
            <Spinner />
            <Box css={{ px: "$1" }}>Success</Box>
          </Badge>
        </Heading>
      </DialogTitle>
      <DialogContent css={{ minWidth: 370 }}>
        <Box
          css={{
            position: "absolute",
            top: 0,
            left: 0,
            width: timeLeft
              ? `${((tx?.estimate - timeLeft) / tx?.estimate) * 100}%`
              : "0%",
            height: 4,
            background:
              "linear-gradient(260.35deg, #F1BC00 0.25%, #E926BE 47.02%, #9326E9 97.86%)",
          }}
        />

        <Box>
          <Header tx={tx} timeLeft={timeLeft} />
          <Box>{Table({ tx, timeLeft })}</Box>
        </Box>

        <DialogClose asChild>
          <Button size="4" variant="primary" css={{ width: "100%" }}>
            Close
          </Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
};

export default Index;

function Table({ tx, timeLeft }) {
  return (
    <Box
      css={{
        border: "1px solid $neutral5",
        borderRadius: "$4",
        bc: "$neutral3",
        mb: "$4",
        p: "$3",
      }}
    >
      <Row>
        <Box>Your account</Box> {tx.from.replace(tx.from.slice(7, 37), "…")}
      </Row>
      <Inputs tx={tx} />
      {/* <Row>
        <Box>Max Transaction fee</Box>{" "}
        {tx.gasPrice && tx.gas
          ? `${parseFloat(Utils.fromWei(tx.gasPrice)) * tx.gas} ETH`
          : "Estimating..."}
      </Row>
      <Row css={{ mb: 0 }}>
        <Box>Estimated wait</Box>
        <Box>
          {timeLeft
            ? `~${moment.duration(timeLeft, "seconds").humanize()} remaining`
            : "Estimating..."}
        </Box>
      </Row> */}
    </Box>
  );
}

function Inputs({ tx }) {
  const inputData = JSON.parse(tx.inputData);
  switch (tx.__typename) {
    case "bond":
      return (
        <>
          <Row>
            <Box>Delegate</Box>{" "}
            {inputData && inputData.to.replace(inputData.to.slice(7, 37), "…")}
          </Row>

          <Row>
            <Box>Amount</Box> {tx.inputData && Utils.fromWei(inputData.amount)}{" "}
            LPT
          </Row>
        </>
      );
    case "unbond":
      return (
        <>
          <Row>
            <Box>Amount</Box> {tx.inputData && Utils.fromWei(inputData.amount)}{" "}
            LPT
          </Row>
        </>
      );
    case "rebondFromUnbonded":
      return (
        <>
          <Row>
            <Box>Delegate</Box>{" "}
            {tx.inputData &&
              inputData.delegate.replace(inputData.delegate.slice(7, 37), "…")}
          </Row>
        </>
      );
    case "vote":
      return (
        <>
          <Row>
            <Box>Vote</Box>{" "}
            {tx.inputData && inputData.choiceId === 0 ? "Yes" : "No"}
          </Row>
        </>
      );
    case "batchClaimEarnings":
      return (
        <>
          <Row>
            <Box>Total Rounds</Box> {tx.inputData && inputData.totalRounds}
          </Row>
        </>
      );
    case "createPoll":
      return null;
    case "withdrawStake":
      return null;
    case "withdrawFees":
      return null;
    case "rebond":
      return null;
    case "approve":
      return null;
    default:
      return null;
  }
}

function Row({ css = {}, children, ...props }) {
  return (
    <Flex
      css={{
        mb: "$3",
        alignItems: "center",
        justifyContent: "space-between",
        fontSize: "$3",
        "&:last-child": {
          mb: 0,
        },
        ...css,
      }}
      {...props}
    >
      {children}
    </Flex>
  );
}

function Header({ css = {}, tx, timeLeft }) {
  return (
    <Flex
      css={{
        alignItems: "center",
        justifyContent: "space-between",
        mb: "$3",
        ...css,
      }}
    >
      <Spinner />
      {/* <Flex
        css={{
          mr: "$3",
          color: "$hiContrast",
          fontSize: "$1",
          fontWeight: "bold",
        }}
      >
        {timeLeft
          ? `${
              Math.floor(((tx?.estimate - timeLeft) / tx?.estimate) * 100) < 100
                ? Math.floor(((tx?.estimate - timeLeft) / tx?.estimate) * 100)
                : "100"
            }%`
          : "0%"}
      </Flex> */}
      <Box css={{ fontWeight: 700, fontSize: "$5" }}>
        {txMessages[tx?.__typename]?.pending}
      </Box>
      <A
        variant="primary"
        css={{ display: "flex", ai: "center" }}
        target="_blank"
        rel="noopener noreferrer"
        href={`https://${
          process.env.NEXT_PUBLIC_NETWORK === "rinkeby" ? "rinkeby." : ""
        }etherscan.io/tx/${tx?.txHash}`}
      >
        Details{" "}
        <Box as={ExternalLinkIcon} css={{ ml: "6px", color: "$primary11" }} />
      </A>
    </Flex>
  );
}
