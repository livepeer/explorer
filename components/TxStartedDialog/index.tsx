import { formatAddress, fromWei, txMessages } from "@lib/utils";
import {
  Badge,
  Box,
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  Flex,
  Heading,
  Link as A,
} from "@livepeer/design-system";
import { ExternalLinkIcon } from "@modulz/radix-icons";
import { TransactionStatus, useAccountAddress, useExplorerStore } from "hooks";
import { CHAIN_INFO, DEFAULT_CHAIN_ID } from "lib/chains";

import Spinner from "../Spinner";

const Index = () => {
  const { latestTransaction, clearLatestTransaction } = useExplorerStore();
  const account = useAccountAddress();

  if (!latestTransaction || latestTransaction.step !== "started") {
    return null;
  }

  return (
    <Dialog
      open={true}
      onOpenChange={(open) => {
        if (!open) {
          clearLatestTransaction();
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
            <Box css={{ paddingLeft: "$1", paddingRight: "$1" }}>Success</Box>
          </Badge>
        </Heading>
      </DialogTitle>
      <DialogContent
        css={{ maxWidth: 370, width: "100%" }}
        onPointerEnterCapture={undefined}
        onPointerLeaveCapture={undefined}
        placeholder={undefined}
      >
        <Box>
          <Header tx={latestTransaction} />
          <Box>{Table({ tx: latestTransaction, account: account ?? "" })}</Box>
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

function Table({ tx, account }: { tx: TransactionStatus; account: string }) {
  return (
    <Box
      css={{
        border: "1px solid $neutral5",
        borderRadius: "$4",
        backgroundColor: "$neutral3",
        marginBottom: "$4",
        padding: "$3",
      }}
    >
      <Row>
        <Box>Your account</Box> {formatAddress(account)}
      </Row>
      <Inputs tx={tx} />
    </Box>
  );
}

function Inputs({ tx }: { tx: TransactionStatus }) {
  const inputData = tx.inputData;
  if (!inputData) return null;

  switch (tx.name) {
    case "bond":
      if (!(inputData.to && inputData.amount)) return null;
      return (
        <>
          <Row>
            <Box>Delegate</Box> {formatAddress(inputData.to)}
          </Row>

          {Number(inputData.amount) > 0 ? (
            <Row>
              <Box>Amount</Box> {fromWei(inputData.amount)} LPT
            </Row>
          ) : (
            <></>
          )}
        </>
      );
    case "unbond":
      if (!inputData.amount) return null;
      return (
        <>
          <Row>
            <Box>Amount</Box> {tx.inputData && fromWei(inputData.amount)} LPT
          </Row>
        </>
      );
    case "rebondFromUnbonded":
      if (!inputData.delegate) return null;
      return (
        <>
          <Row>
            <Box>Delegate</Box> {formatAddress(inputData.delegate)}
          </Row>
        </>
      );
    case "vote":
      return (
        <>
          <Row>
            <Box>Vote</Box>{" "}
            {inputData.choiceName ||
              (inputData.choiceId === 0 ? "For" : "Against")}
          </Row>
        </>
      );
    case "batchClaimEarnings":
      return (
        <>
          <Row>
            <Box>Total Rounds</Box> {inputData.totalRounds}
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
    // case "initializeRound":
    //   return null;
    case "claimStake":
      if (!(inputData.stake && inputData.fees)) return null;
      return (
        <>
          <Row>
            <Box>Stake</Box> {fromWei(inputData.stake)}
          </Row>

          <Row>
            <Box>Fees</Box> {fromWei(inputData.fees)} LPT
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
        marginBottom: "$3",
        alignItems: "center",
        justifyContent: "space-between",
        fontSize: "$3",
        "&:last-child": {
          marginBottom: 0,
        },
        ...css,
      }}
      {...props}
    >
      {children}
    </Flex>
  );
}

function Header({ tx }: { tx: TransactionStatus }) {
  return (
    <Flex
      css={{
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "$3",
      }}
    >
      <Spinner />
      <Box css={{ fontWeight: 700, fontSize: "$5" }}>
        {txMessages[tx?.name ?? ""]?.pending}
      </Box>
      <A
        variant="primary"
        css={{ display: "flex", alignItems: "center" }}
        target="_blank"
        rel="noopener noreferrer"
        href={`${CHAIN_INFO[DEFAULT_CHAIN_ID].explorer}tx/${tx?.hash}`}
      >
        Details{" "}
        <Box
          as={ExternalLinkIcon}
          css={{ marginLeft: "6px", color: "$primary11" }}
        />
      </A>
    </Flex>
  );
}
