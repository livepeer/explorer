import { LAYOUT_MAX_WIDTH } from "@layouts/main";
import { bondingManager } from "@lib/api/abis/main/BondingManager";
import { Box, Button, Container, Flex, Text } from "@livepeer/design-system";
import {
  useAccountAddress,
  useHandleTransaction,
  useTreasuryRegisteredToVoteData,
} from "hooks";
import { useBondingManagerAddress } from "hooks/useContracts";

import { useMemo, useState } from "react";
import { Address, useContractWrite, usePrepareContractWrite } from "wagmi";

type ButtonProps = React.ComponentProps<typeof Button> & {
  bondingManagerAddress: Address | undefined;
  targetAddress: Address | null;
  isOrchestrator: boolean;
  onSuccess?: () => void;
};

const CheckpointButton = ({
  bondingManagerAddress,
  targetAddress,
  isOrchestrator,
  onSuccess,
  disabled,
  children,
  ...props
}: ButtonProps) => {
  disabled ||= !Boolean(bondingManagerAddress && targetAddress);
  const { config } = usePrepareContractWrite({
    enabled: !disabled,
    address: bondingManagerAddress,
    abi: bondingManager,
    functionName: "checkpointBondingState",
    args: [targetAddress!],
  });
  const { data, isLoading, write, error, isSuccess } = useContractWrite(config);

  useHandleTransaction(
    "checkpoint",
    data,
    error,
    isLoading,
    isSuccess,
    { targetAddress, isOrchestrator },
    onSuccess
  );

  return (
    <Button
      {...props}
      size="3"
      variant="transparentBlack"
      ghost
      disabled={disabled}
      onClick={write}
    >
      {children}
    </Button>
  );
};

const RegisterToVote = () => {
  const { data: bondingManagerAddress } = useBondingManagerAddress();
  const accountAddress = useAccountAddress();

  const [hasRegisteredOrch, setHasRegisteredOrch] = useState(false);
  const [hasRegisteredSelf, setHasRegisteredSelf] = useState(false);

  const voteState = useTreasuryRegisteredToVoteData(
    accountAddress?.toLowerCase() ?? ""
  );

  const uiState = useMemo(
    () =>
      !voteState
        ? null
        : {
            self: {
              registered: hasRegisteredSelf,
              pending: !hasRegisteredSelf && !voteState.registered,
            },
            orchestrator: {
              registered: hasRegisteredOrch,
              pending:
                !hasRegisteredOrch &&
                voteState.delegate.address !== accountAddress &&
                !voteState.delegate.registered,
            },
          },
    [voteState, accountAddress, hasRegisteredOrch, hasRegisteredSelf]
  );

  const showBanner =
    uiState && (uiState.self.pending || uiState.orchestrator.pending);

  if (!voteState || !showBanner) {
    return null;
  }

  // we want to keep the ui consistent after the transactions are done
  const showSelfUi = uiState.self.pending || hasRegisteredSelf;
  const showOrchUi = uiState.orchestrator.pending || hasRegisteredOrch;

  return (
    <Container css={{ maxWidth: LAYOUT_MAX_WIDTH, marginBottom: "$5" }}>
      <Box
        css={{
          marginTop: "$5",
          borderRadius: 10,
          width: "100%",
          padding: "$4",
          color: "$loContrast",
          backgroundColor: "$amber11",
        }}
      >
        <Box
          css={{
            marginBottom: "$2",
            fontSize: "$6",
            fontWeight: 600,
          }}
        >
          Register to Vote!
        </Box>
        <Box>
          <Text css={{ color: "$loContrast" }}>
            Your voting power is not yet registered on the onchain treasury
            introduced in the Delta upgrade. Checkpoint your stake below to be
            able to vote on future treasury proposals. Alternatively, any stake
            changes like claiming rewards will automatically do this for you.
          </Text>

          {showOrchUi && (
            <Text css={{ color: "$loContrast", marginTop: "$2" }}>
              Notice that your orchestrator also needs to be checkpointed to
              have your voting power registered. You can checkpoint their stake
              before your own below.
            </Text>
          )}

          <Flex>
            {showOrchUi && (
              <CheckpointButton
                bondingManagerAddress={bondingManagerAddress}
                targetAddress={voteState.delegate?.address}
                isOrchestrator={true}
                css={{ marginTop: "$2", marginRight: "$2" }}
                variant="transparentBlack"
                ghost
                disabled={hasRegisteredOrch}
                onSuccess={() => setHasRegisteredOrch(true)}
              >
                Checkpoint your Orchestrator
              </CheckpointButton>
            )}

            {showSelfUi && (
              <CheckpointButton
                bondingManagerAddress={bondingManagerAddress}
                targetAddress={accountAddress}
                isOrchestrator={false}
                size="3"
                css={{ marginTop: "$2" }}
                variant="transparentBlack"
                ghost
                disabled={hasRegisteredSelf || uiState.orchestrator.pending} // orchestrator should be checkpointed first
                onSuccess={() => setHasRegisteredSelf(true)}
              >
                Checkpoint yourself
              </CheckpointButton>
            )}
          </Flex>
        </Box>
      </Box>
    </Container>
  );
};

export default RegisterToVote;
