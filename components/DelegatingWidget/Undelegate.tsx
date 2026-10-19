import { bondingManager } from "@lib/api/abis/main/BondingManager";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Flex,
  Text,
} from "@livepeer/design-system";
import { useAccountAddress } from "hooks";
import { useBondingManagerAddress } from "hooks/useContracts";
import { useSubmitTransaction } from "hooks/useSubmitTransaction";
import { useState } from "react";
import { useSimulateContract, useWriteContract } from "wagmi";

interface Props {
  amount: string;
  amountWei: bigint | null;
  newPosPrev: string;
  newPosNext: string;
  disabled: boolean;
  willDeactivate: boolean;
}

const Undelegate = ({
  amount,
  amountWei,
  newPosPrev,
  newPosNext,
  disabled,
  willDeactivate,
}: Props) => {
  const accountAddress = useAccountAddress();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const canUndelegate = !disabled && amountWei !== null && amountWei > 0n;

  const args = {
    amount: amountWei ?? 0n,
    newPosPrev,
    newPosNext,
  };

  const { data: bondingManagerAddress } = useBondingManagerAddress();

  const { data: config } = useSimulateContract({
    query: { enabled: Boolean(bondingManagerAddress) && canUndelegate },
    address: bondingManagerAddress,
    abi: bondingManager,
    functionName: "unbondWithHint",
    args: [
      args.amount,
      newPosPrev as `0x${string}`,
      newPosNext as `0x${string}`,
    ],
  });
  const { writeContractAsync } = useWriteContract();
  const submitUnbond = useSubmitTransaction("unbond");

  const handleSubmit = () => {
    if (!canUndelegate || !config) return;
    void submitUnbond(() => writeContractAsync(config.request), {
      ...args,
      wasDeactivated: willDeactivate,
    });
  };

  const handleUndelegate = () => {
    if (!canUndelegate || !config) return;
    if (willDeactivate) {
      setShowConfirmDialog(true);
    } else {
      handleSubmit();
    }
  };

  const handleConfirmUnbond = () => {
    setShowConfirmDialog(false);
    handleSubmit();
  };

  if (!accountAddress) {
    return null;
  }

  return (
    <>
      <Button
        size="4"
        variant="red"
        disabled={!canUndelegate || !config}
        css={{
          width: "100%",
        }}
        onClick={handleUndelegate}
      >
        {!amount ? "Enter an amount" : "Undelegate"}
      </Button>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent css={{ maxWidth: 390, width: "100%" }}>
          <DialogTitle asChild>
            <Text
              as="h2"
              css={{
                fontWeight: 600,
                fontSize: "$4",
                marginBottom: "$3",
                lineHeight: 1.3,
              }}
            >
              Unbonding all stake
            </Text>
          </DialogTitle>

          <Text
            css={{
              marginBottom: "$4",
              color: "$neutral11",
              lineHeight: 1.5,
            }}
          >
            This will{" "}
            <Text as="span" css={{ color: "$yellow9" }}>
              deactivate your orchestrator
            </Text>{" "}
            and remove you from the active set. You&apos;ll stop earning rewards
            until you stake again.
          </Text>

          <Box
            css={{
              background: "$neutral3",
              border: "1px solid $neutral5",
              borderRadius: "$2",
              padding: "$3",
              marginBottom: "$4",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text css={{ color: "$neutral11" }}>Amount</Text>
            <Text
              css={{
                fontWeight: 600,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {amount} LPT
            </Text>
          </Box>

          <Flex css={{ gap: "$2", justifyContent: "flex-end" }}>
            <Button
              size="3"
              ghost
              onClick={() => setShowConfirmDialog(false)}
              css={{ minWidth: "unset" }}
            >
              Cancel
            </Button>
            <Button
              size="3"
              variant="red"
              onClick={handleConfirmUnbond}
              disabled={!canUndelegate || !config}
            >
              Yes, unbond my stake
            </Button>
          </Flex>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Undelegate;
