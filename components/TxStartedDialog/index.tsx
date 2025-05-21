import { fromWei, txMessages } from "@lib/utils";
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
import { TransactionStatus, useAccountAddress, useExplorerStore } from "hooks";

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
            <Box css={{ px: "$1" }}>Success</Box>
          </Badge>
        </Heading>
      </DialogTitle>
      <DialogContent css={{ maxWidth: 370, width: "100%" }}>
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
        bc: "$neutral3",
        mb: "$4",
        p: "$3",
      }}
    >
      <Row>
        <Box>Your account</Box> {account?.replace(account?.slice(7, 37), "…")}
      </Row>
      <Inputs tx={tx} />
    </Box>
  );
}

function Inputs({ tx }: { tx: TransactionStatus }) {
  const inputData = tx.inputData;
  switch (tx.name) {
    case "bond":
      return (
        <>
          <Row>
            <Box>Delegate</Box>{" "}
            {inputData && inputData.to.replace(inputData.to.slice(7, 37), "…")}
          </Row>

          {Number(inputData.amount) > 0 ? (
            <Row>
              <Box>Amount</Box> {tx.inputData && fromWei(inputData.amount)} LPT
            </Row>
          ) : (
            <></>
          )}
        </>
      );
    case "unbond":
      return (
        <>
          <Row>
            <Box>Amount</Box> {tx.inputData && fromWei(inputData.amount)} LPT
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
    // case "initializeRound":
    //   return null;
    case "claimStake":
      return (
        <>
          <Row>
            <Box>Stake</Box> {tx.inputData && fromWei(inputData.stake)}
          </Row>

          <Row>
            <Box>Fees</Box> {tx.inputData && fromWei(inputData.fees)} LPT
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

function Header({ tx }: { tx: TransactionStatus }) {
  return (
    <Flex
      css={{
        alignItems: "center",
        justifyContent: "space-between",
        mb: "$3",
      }}
    >
      <Spinner />
      <Box css={{ fontWeight: 700, fontSize: "$5" }}>
        {txMessages[tx?.name ?? ""]?.pending}
      </Box>
      <A
        variant="primary"
        css={{ display: "flex", ai: "center" }}
        target="_blank"
        rel="noopener noreferrer"
        href={`${CHAIN_INFO[DEFAULT_CHAIN_ID].explorer}tx/${tx?.hash}`}
      >
        Details{" "}
        <Box as={ExternalLinkIcon} css={{ ml: "6px", color: "$primary11" }} />
      </A>
    </Flex>
  );
}
