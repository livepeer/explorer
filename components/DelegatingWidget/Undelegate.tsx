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
import { useHandleTransaction } from "hooks/useHandleTransaction";
import { useState } from "react";
import { useSWRConfig } from "swr";
import { parseEther } from "viem";
import { useSimulateContract, useWriteContract } from "wagmi";

interface Props {
  amount: string;
  newPosPrev: string;
  newPosNext: string;
  disabled: boolean;
  willDeactivate: boolean;
}

const Undelegate = ({
  amount,
  newPosPrev,
  newPosNext,
  disabled,
  willDeactivate,
}: Props) => {
  const accountAddress = useAccountAddress();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const args = {
    amount: parseEther(amount ? amount.toString() : "0"),
    newPosPrev,
    newPosNext,
  };

  const { data: bondingManagerAddress } = useBondingManagerAddress();

  const { data: config } = useSimulateContract({
    query: { enabled: Boolean(bondingManagerAddress) },
    address: bondingManagerAddress,
    abi: bondingManager,
    functionName: "unbondWithHint",
    args: [
      BigInt(args.amount.toString()),
      newPosPrev as `0x${string}`,
      newPosNext as `0x${string}`,
    ],
  });
  const { data, isPending, writeContract, error, isSuccess } =
    useWriteContract();

  useHandleTransaction("unbond", data, error, isPending, isSuccess, {
    ...args,
    wasDeactivated: willDeactivate,
  });

  const { mutate } = useSWRConfig();
  const handleUndelegate = () => {
    if (willDeactivate) {
      setShowConfirmDialog(true);
    } else if (config) {
      writeContract(config.request);
      if (accountAddress) {
        setTimeout(() => {
          mutate(`/api/ssr/account/${accountAddress.toLowerCase()}`);
        }, 15000);
      }
    }
  };

  const handleConfirmUnbond = () => {
    setShowConfirmDialog(false);
    if (config) {
      writeContract(config.request);
    }
  };

  if (!accountAddress) {
    return null;
  }

  return (
    <>
      <Button
        size="4"
        variant="red"
        disabled={disabled || !config}
        css={{
          width: "100%",
        }}
        onClick={handleUndelegate}
      >
        {!amount ? "Enter an amount" : "Undelegate"}
      </Button>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent
          css={{ maxWidth: 390, width: "100%" }}
          onPointerEnterCapture={undefined}
          onPointerLeaveCapture={undefined}
          placeholder={undefined}
        >
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
              disabled={!config}
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
