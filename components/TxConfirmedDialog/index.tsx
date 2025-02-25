import React, { useCallback } from "react";
import { fromWei, txMessages } from "../../lib/utils";
import { MdReceipt } from "react-icons/md";
import Router, { useRouter } from "next/router";
import {
  Box,
  Flex,
  Button,
  Dialog,
  DialogTitle,
  DialogClose,
  DialogContent,
  Link as A,
  Badge,
  Heading,
} from "@livepeer/design-system";
import { CheckIcon } from "@modulz/radix-icons";
import { CHAIN_INFO, DEFAULT_CHAIN_ID } from "lib/chains";
import { TransactionStatus, useExplorerStore } from "hooks";
import QueueExecuteButton from "@components/QueueExecuteButton";

const Index = () => {
  const router = useRouter();
  const { latestTransaction, clearLatestTransaction } = useExplorerStore();

  const onDismiss = useCallback(() => {
    clearLatestTransaction();
    if (latestTransaction?.name === "propose") {
      router.push("/treasury");
    }
  }, [clearLatestTransaction, latestTransaction, router]);

  if (!latestTransaction || latestTransaction.step !== "confirmed") {
    return null;
  }

  return (
    <Dialog
      open={true}
      onOpenChange={(open) => {
        if (!open) {
          onDismiss();
        }
      }}
    >
      <DialogContent
        onPointerDownOutside={onDismiss}
        css={{ maxWidth: 390, width: "100%" }}
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
            Confirmed
            <Badge
              variant="primary"
              size="1"
              css={{ display: "flex", alignItems: "center" }}
            >
              <CheckIcon />
              <Box css={{ px: "$1" }}>Success</Box>
            </Badge>
          </Heading>
        </DialogTitle>
        {renderSwitch(latestTransaction, onDismiss)}
      </DialogContent>
    </Dialog>
  );
};

export default Index;

function renderSwitch(tx: TransactionStatus, onDismiss: () => void) {
  switch (tx.name) {
    case "bond":
      return (
        <Box>
          <Table css={{ mb: "$3" }}>
            <Header tx={tx} />
            <Box css={{ px: "$3", py: "$4" }}>
              <Box>
                {Number(tx.inputData.amount) <= 0
                  ? `Congrats! You've successfully migrated your stake to a new orchestrator.`
                  : `Congrats! You've successfully delegated
                ${fromWei(tx.inputData.amount)} LPT.`}
              </Box>
            </Box>
          </Table>
          <Button
            onClick={onDismiss}
            size="4"
            variant="primary"
            css={{ width: "100%" }}
          >
            Close
          </Button>
        </Box>
      );
    case "unbond":
      return (
        <Box>
          <Table css={{ mb: "$4" }}>
            <Header tx={tx} />
            <Box css={{ px: "$3", py: "$4" }}>
              <Box>
                You&apos;ve successfully undelegated{" "}
                {fromWei(tx.inputData.amount)} LPT. The unbonding period is ~7
                days after which you may withdraw the undelegated LPT into your
                wallet.
              </Box>
            </Box>
          </Table>
          <DialogClose asChild>
            <Button size="4" variant="primary" css={{ width: "100%" }}>
              Close
            </Button>
          </DialogClose>
        </Box>
      );
    case "approve":
      return (
        <Box>
          <Table css={{ mb: "$4" }}>
            <Header tx={tx} />
            <Box css={{ px: "$3", py: "$4" }}>
              {tx.inputData.type === "createPoll" ? (
                <Box>Nice one! You may now proceed with creating a poll.</Box>
              ) : (
                <Box>
                  Nice one! You may now proceed with delegating your LPT with an
                  orchestrator.
                </Box>
              )}
            </Box>
          </Table>
          <DialogClose asChild>
            <Button size="4" variant="primary" css={{ width: "100%" }}>
              Close
            </Button>
          </DialogClose>
        </Box>
      );
    case "rebond":
      return (
        <Box>
          <Table css={{ mb: "$4" }}>
            <Header tx={tx} />
            <Box css={{ px: "$3", py: "$4" }}>Successfully redelegated.</Box>
          </Table>
          <DialogClose asChild>
            <Button size="4" variant="primary" css={{ width: "100%" }}>
              Close
            </Button>
          </DialogClose>
        </Box>
      );
    case "rebondFromUnbonded":
      return (
        <Box>
          <Table css={{ mb: "$4" }}>
            <Header tx={tx} />
            <Box css={{ px: "$3", py: "$4" }}>
              You&apos;ve successfully redelegated to orchestrator{" "}
              {tx.inputData &&
                tx.inputData.delegate.replace(
                  tx.inputData.delegate.slice(7, 37),
                  "…"
                )}
            </Box>
          </Table>
          <DialogClose asChild>
            <Button size="4" variant="primary" css={{ width: "100%" }}>
              Close
            </Button>
          </DialogClose>
        </Box>
      );
    case "checkpoint":
      const { targetAddress, isOrchestrator } = tx.inputData ?? {};
      return (
        <Box>
          <Table css={{ mb: "$4" }}>
            <Header tx={tx} />
            <Box css={{ px: "$3", py: "$4" }}>
              You&apos;ve successfully checkpointed{" "}
              {!isOrchestrator
                ? "your stake"
                : `your orchestrator (${targetAddress.replace(
                    targetAddress.slice(7, 37),
                    "…"
                  )}) stake!`}
            </Box>
          </Table>
          <DialogClose asChild>
            <Button size="4" variant="primary" css={{ width: "100%" }}>
              Close
            </Button>
          </DialogClose>
        </Box>
      );
    case "propose":
      return (
        <Box>
          <Table css={{ mb: "$4" }}>
            <Header tx={tx} />
            <Box css={{ px: "$3", py: "$4" }}>
              You&apos;ve successfully made a treasury proposal!
            </Box>
          </Table>
          <DialogClose asChild>
            <Button size="4" variant="primary" css={{ width: "100%" }}>
              Close
            </Button>
          </DialogClose>
        </Box>
      );
    case "vote":
      return (
        <Box>
          <Table css={{ mb: "$4" }}>
            <Header tx={tx} />
            <Box css={{ px: "$3", py: "$4" }}>
              You&apos;ve successfully casted a vote
              {` "${tx.inputData?.choiceName}"`}
            </Box>
          </Table>
          <DialogClose asChild>
            <Button size="4" variant="primary" css={{ width: "100%" }}>
              Close
            </Button>
          </DialogClose>
        </Box>
      );
    case "queue":
      return (
        <Box>
          <Table css={{ mb: "$4" }}>
            <Header tx={tx} />
            <Box css={{ px: "$3", py: "$4" }}>
              You&apos;ve successfully enqueued the proposal for execution!
              {"\n\n"}
              You may also execute the proposal below if available.
            </Box>
          </Table>
          <Flex>
            <QueueExecuteButton
              action="execute"
              size="4"
              variant="primary"
              css={{ mr: "$2", flex: 1 }}
              proposal={tx.inputData?.proposal}
              onClick={onDismiss}
            />
            <DialogClose asChild>
              <Button size="4" variant="primary" css={{ flex: 1 }}>
                Close
              </Button>
            </DialogClose>
          </Flex>
        </Box>
      );
    case "execute":
      return (
        <Box>
          <Table css={{ mb: "$4" }}>
            <Header tx={tx} />
            <Box css={{ px: "$3", py: "$4" }}>
              You&apos;ve successfully executed the treasury proposal!
            </Box>
          </Table>
          <DialogClose asChild>
            <Button size="4" variant="primary" css={{ width: "100%" }}>
              Close
            </Button>
          </DialogClose>
        </Box>
      );
    case "batchClaimEarnings":
      return (
        <Box>
          <Table css={{ mb: "$4" }}>
            <Header tx={tx} />
            <Box css={{ px: "$3", py: "$4" }}>
              Successfully claimed {tx.inputData && tx.inputData.totalRounds}{" "}
              rounds
            </Box>
          </Table>
          <DialogClose asChild>
            <Button size="4" variant="primary" css={{ width: "100%" }}>
              Close
            </Button>
          </DialogClose>
        </Box>
      );
    case "createPoll":
      return (
        <Box>
          <Table css={{ mb: "$4" }}>
            <Header tx={tx} />
            <Box css={{ px: "$3", py: "$4" }}>
              Nice one! You&apos;ve successfully created a poll. Head on over to
              the Governance page to view your newly created poll.
            </Box>
          </Table>
          <DialogClose asChild>
            <Button size="4" variant="primary" css={{ width: "100%" }}>
              Close
            </Button>
          </DialogClose>
        </Box>
      );
    case "withdrawStake":
      return (
        <Box>
          <Table css={{ mb: "$4" }}>
            <Header tx={tx} />
            <Box css={{ px: "$3", py: "$4" }}>
              Successfully withdrawn stake.
            </Box>
          </Table>
          <DialogClose asChild>
            <Button size="4" variant="primary" css={{ width: "100%" }}>
              Close
            </Button>
          </DialogClose>
        </Box>
      );
    case "withdrawFees":
      return (
        <Box>
          <Table css={{ mb: "$4" }}>
            <Header tx={tx} />
            <Box css={{ px: "$3", py: "$4" }}>Successfully withdrawn fees.</Box>
          </Table>
          <DialogClose asChild>
            <Button size="4" variant="primary" css={{ width: "100%" }}>
              Close
            </Button>
          </DialogClose>
        </Box>
      );
    case "claimStake":
      return (
        <Box>
          <Table css={{ mb: "$3" }}>
            <Header tx={tx} />
            <Box css={{ px: "$3", py: "$4" }}>
              <Box>
                Congrats! You&apos;ve successfully claimed your stake and fees
                on {CHAIN_INFO[DEFAULT_CHAIN_ID].label}. Your account page will
                reflect your balance momentarily.
              </Box>
            </Box>
          </Table>
          <Button
            onClick={onDismiss}
            size="4"
            variant="primary"
            css={{ width: "100%" }}
          >
            Close
          </Button>
        </Box>
      );
    default:
      return null;
  }
}

function Table({ css = {}, children, ...props }) {
  return (
    <Box
      css={{
        border: "1px solid $neutral4",
        borderRadius: "$4",
        backgroundColor: "$neutral3",
        ...css,
      }}
      {...props}
    >
      {children}
    </Box>
  );
}

function Header({ tx }: { tx: TransactionStatus }) {
  return (
    <Flex
      css={{
        borderBottom: "1px solid $neutral5",
        alignItems: "center",
        justifyContent: "space-between",
        p: "$3",
      }}
    >
      <Flex css={{ fontWeight: 700, alignItems: "center" }}>
        <Box css={{ mr: "10px" }}>🎉</Box>
        {txMessages[tx?.name ?? ""]?.confirmed}
      </Flex>
      <A
        variant="primary"
        css={{ display: "flex", alignItems: "center" }}
        target="_blank"
        rel="noopener noreferrer"
        href={`${CHAIN_INFO[DEFAULT_CHAIN_ID].explorer}tx/${tx?.hash}`}
      >
        Transfer Receipt{" "}
        <Box css={{ ml: "6px", color: "$primary10" }}>
          <MdReceipt />
        </Box>
      </A>
    </Flex>
  );
}
