import React from "react";
import { txMessages } from "../../lib/utils";
import { MdReceipt } from "react-icons/md";
import Utils from "web3-utils";
import Router from "next/router";
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
import { CHAIN_INFO, DEFAULT_CHAIN_ID } from "constants/chains";

const Index = ({ tx, isOpen, onDismiss }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <Dialog
      open={isOpen}
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
        {renderSwitch({ tx, onDismiss })}
      </DialogContent>
    </Dialog>
  );
};

export default Index;

function renderSwitch({ tx, onDismiss }) {
  const inputData = JSON.parse(tx.inputData);

  switch (tx.__typename) {
    case "bond":
      return (
        <Box>
          <Table css={{ mb: "$3" }}>
            <Header tx={tx} />
            <Box css={{ px: "$3", py: "$4" }}>
              <Box>
                Congrats! You&apos;ve successfully delegated{" "}
                {Utils.fromWei(inputData.amount)} LPT.
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
                {Utils.fromWei(inputData.amount)} LPT. The unbonding period is
                ~7 days after which you may withdraw the undelegated LPT into
                your wallet.
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
              {inputData.type === "createPoll" ? (
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
                inputData.delegate.replace(
                  inputData.delegate.slice(7, 37),
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
    case "vote":
      return (
        <Box>
          <Table css={{ mb: "$4" }}>
            <Header tx={tx} />
            <Box css={{ px: "$3", py: "$4" }}>
              You&apos;ve successfully casted a vote{" "}
              {tx.inputData && inputData.choiceId === 0 ? '"Yes"' : '"No"'}
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
              Successfully claimed {tx.inputData && inputData.totalRounds}{" "}
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
              the{" "}
              <Box
                as="a"
                css={{ cursor: "pointer" }}
                onClick={() => {
                  onDismiss();
                  Router.push("/voting");
                }}
              >
                voting dashboard
              </Box>{" "}
              to view your newly created poll.
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
                on {CHAIN_INFO[DEFAULT_CHAIN_ID].label}.
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

function Header({ tx }) {
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
        {txMessages[tx?.__typename]?.confirmed}
      </Flex>
      <A
        variant="primary"
        css={{ display: "flex", alignItems: "center" }}
        target="_blank"
        rel="noopener noreferrer"
        href={`${CHAIN_INFO[DEFAULT_CHAIN_ID].explorer}tx/${tx?.txHash}`}
      >
        Transfer Receipt{" "}
        <Box css={{ ml: "6px", color: "$primary10" }}>
          <MdReceipt />
        </Box>
      </A>
    </Flex>
  );
}
