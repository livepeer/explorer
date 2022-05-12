import { txMessages } from "@lib/utils";
import Utils from "web3-utils";
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
import { CHAIN_INFO, DEFAULT_CHAIN_ID } from "lib/chains";

const Index = ({ tx, isOpen, onDismiss }) => {
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
      <DialogContent css={{ maxWidth: 370, width: "100%" }}>
        <Box>
          <Header tx={tx} />
          <Box>{Table({ tx })}</Box>
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

function Table({ tx }) {
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
    case "initializeRound":
      return null;
    case "claimStake":
      return (
        <>
          <Row>
            <Box>Stake</Box> {tx.inputData && Utils.fromWei(inputData.stake)}
          </Row>

          <Row>
            <Box>Fees</Box> {tx.inputData && Utils.fromWei(inputData.fees)} LPT
          </Row>
        </>
      );
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

function Header({ css = {}, tx }) {
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
        href={`${CHAIN_INFO[DEFAULT_CHAIN_ID].explorer}tx/${tx?.txHash}`}
      >
        Details{" "}
        <Box as={ExternalLinkIcon} css={{ ml: "6px", color: "$primary11" }} />
      </A>
    </Flex>
  );
}
