import {
  Box,
  Flex,
  Heading,
  Text,
  Container,
  Card,
  styled,
  Button,
  TextField,
  Link as A,
} from "@livepeer/design-system";
import { getLayout } from "@layouts/main";
import { useEffect, useState } from "react";
import Spinner from "@components/Spinner";
import { useWeb3React } from "@web3-react/core";
import WalletModal from "@components/WalletModal";
import { Step, StepContent, StepLabel, Stepper } from "@material-ui/core";
import { CodeBlock } from "@components/CodeBlock";
import { ethers } from "ethers";
import useForm from "react-hook-form";
import migratorABI from "../abis/bridge/L1Migrator.json";
import arbRetryableTxABI from "../abis/bridge/ArbRetryableTx.json";
import nodeInterfaceABI from "../abis/bridge/NodeInterface.json";
import {
  CHAIN_INFO,
  DEFAULT_CHAIN_ID,
  INFURA_NETWORK_URLS,
  L1_CHAIN_ID,
} from "constants/chains";
import { waitForTx, waitToRelayTxsToL2 } from "utils/messaging";
import LivepeerSDK from "@livepeer/sdk";
import { ArrowTopRightIcon } from "@modulz/radix-icons";
import { useTimer } from "react-timer-hook";
import { stepperStyles } from "../utils/stepperStyles";
import { isValidAddress } from "utils/validAddress";

type MigrationState = {
  step: number;
  title: string;
  subtitle: string;
  loading: boolean;
  isOrchestrator?: boolean;
  mainnetTransactionHash?: string;
  arbitrumTransactionHash?: string;
  image?: string;
  showNetworkSwitcher?: boolean;
  disclaimer?: string;
};

const isRegisteredOrchestrator = async (account) => {
  const sdk = await LivepeerSDK({
    controllerAddress: CHAIN_INFO[L1_CHAIN_ID].contracts.controller,
    provider: INFURA_NETWORK_URLS[L1_CHAIN_ID],
    account: account,
  });
  const status = await sdk.rpc.getTranscoderStatus(account);
  return status === "Registered" ? true : false;
};

const signingSteps = [
  "Enter orchestrator Ethereum Address",
  "Sign message",
  "Approve migration",
];

const l1Provider = new ethers.providers.JsonRpcProvider(
  INFURA_NETWORK_URLS[L1_CHAIN_ID]
);

const l2Provider = new ethers.providers.JsonRpcProvider(
  INFURA_NETWORK_URLS[DEFAULT_CHAIN_ID]
);

const l1Migrator = new ethers.Contract(
  CHAIN_INFO[DEFAULT_CHAIN_ID].contracts.l1Migrator,
  migratorABI,
  l1Provider
);

const arbRetryableTx = new ethers.Contract(
  CHAIN_INFO[DEFAULT_CHAIN_ID].contracts.arbRetryableTx,
  arbRetryableTxABI,
  l2Provider
);

const nodeInterface = new ethers.Contract(
  CHAIN_INFO[DEFAULT_CHAIN_ID].contracts.nodeInterface,
  nodeInterfaceABI,
  l2Provider
);

const Migrate = () => {
  const context = useWeb3React();
  const [activeStep, setActiveStep] = useState(0);
  const [migrationParams, setMigrationParams] = useState(undefined);
  const [validSignerAddress, setValidSignerAddress] = useState(undefined);
  const [migrationCallData, setMigrationCallData] = useState(undefined);
  const { register, watch } = useForm();
  const signature = watch("signature");
  const signerAddress = watch("signerAddress");
  const time = new Date();
  time.setSeconds(time.getSeconds() + 600); // 10 minutes timer

  const { seconds, minutes, start, restart } = useTimer({
    autoStart: false,
    expiryTimestamp: time,
    onExpire: () => console.warn("onExpire called"),
  });

  const [migrationViewState, setMigrationViewState] = useState<
    MigrationState | undefined
  >({
    step: 0,
    title: `Migrate to ${CHAIN_INFO[DEFAULT_CHAIN_ID].label}`,
    subtitle:
      "This tool will safely migrate your orchestrator's stake and fees from Rinkeby to Arbitrum Rinkeby.",
    loading: false,
    image: "/img/arbitrum.svg",
  });

  // Update estimation timer
  useEffect(() => {
    if (migrationViewState.step === 4) {
      setMigrationViewState((m) => ({
        ...m,
        subtitle: `Estimated time remaining: ${minutes}:${seconds
          .toString()
          .padStart(2, "0")}`,
      }));
    }
  }, [migrationViewState.step, minutes, seconds]);

  useEffect(() => {
    const init = async () => {
      if (isValidAddress(signerAddress)) {
        const isOrchestrator = isRegisteredOrchestrator(
          isValidAddress(signerAddress)
        );
        if (isOrchestrator) {
          setValidSignerAddress(isValidAddress(signerAddress));
        } else {
          setValidSignerAddress(null);
        }
      } else {
        setValidSignerAddress(null);
      }
    };
    init();
  }, [signerAddress, context.chainId]);

  useEffect(() => {
    const init = async () => {
      if (context.account) {
        // fetch calldata to be submitted for calling L2 function
        const { data, params } = await l1Migrator.getMigrateDelegatorParams(
          validSignerAddress ? validSignerAddress : context.account,
          validSignerAddress ? validSignerAddress : context.account
        );

        setMigrationCallData(data);

        setMigrationParams({
          delegate: params.delegate,
          delegatedStake: params.delegatedStake,
          stake: params.stake,
          fees: params.fees,
          l1Addr: params.l1Addr,
          l2Addr: params.l2Addr,
        });
      }
    };
    init();
  }, [validSignerAddress, context.account]);

  useEffect(() => {
    const init = async () => {
      if (!context.account) {
        // if there's no account, fallback to step 0
        // which promps wallet connection
        setMigrationViewState((m) => ({
          ...m,
          step: 0,
          title: `Migrate to ${CHAIN_INFO[DEFAULT_CHAIN_ID].label}`,
          subtitle:
            "This tool will safely migrate your orchestrator's stake and fees from Rinkeby to Arbitrum Rinkeby.",
          loading: false,
          image: "/img/arbitrum.svg",
        }));
      }

      if (context.account) {
        // Check if connected account belongs to register orchestrator
        const isOrchestrator = await isRegisteredOrchestrator(context.account);
        setMigrationViewState((m) => ({
          ...m,
          isOrchestrator,
        }));

        // Advance to step 1 since wallet is connected
        if (migrationViewState.step === 0) {
          setMigrationViewState((m) => ({
            ...m,
            step: 1,
            title: `Migrate to ${CHAIN_INFO[DEFAULT_CHAIN_ID].label}`,
            subtitle:
              "This tool will safely migrate your orchestrator's stake and fees from Rinkeby to Arbitrum Rinkeby.",
            loading: false,
            image: null,
            disclaimer:
              "Note: It will take 10 minutes for you to see your stake and fee balances credited on Arbitrum once you initiate the migration.",
          }));
        }
      }
    };
    init();
  }, [
    migrationViewState.isOrchestrator,
    migrationViewState.step,
    context.account,
  ]);

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleReset = () => {
    const time = new Date();
    time.setSeconds(time.getSeconds() + 600);
    restart(time, false); // restart timer

    setMigrationViewState({
      ...migrationViewState,
      step: 1,
      title: `Migrate to ${CHAIN_INFO[DEFAULT_CHAIN_ID].label}`,
      subtitle:
        "This tool will safely migrate your orchestrator's stake and fees from Rinkeby to Arbitrum Rinkeby.",
      loading: false,
      image: null,
      disclaimer:
        "Note: It will take 10 minutes for you to see your stake and fee balances credited on Arbitrum once you initiate the migration.",
    });
  };

  const onApprove = async () => {
    try {
      setMigrationViewState({
        ...migrationViewState,
        step: 2,
        title: "Initiate Migration",
        subtitle: "Confirm the transaction in your wallet.",
        loading: true,
      });
      const gasPriceBid = await l2Provider.getGasPrice();

      // fetching submission price
      // https://developer.offchainlabs.com/docs/l1_l2_messages#parameters
      const [submissionPrice] = await arbRetryableTx.getSubmissionPrice(
        migrationCallData.length
      );

      // overpaying submission price to account for increase
      // https://developer.offchainlabs.com/docs/l1_l2_messages#important-note-about-base-submission-fee
      // the excess will be sent back to the refund address
      const maxSubmissionPrice = submissionPrice.mul(4);

      // calculating estimated gas for the tx
      const [estimatedGas] = await nodeInterface.estimateRetryableTicket(
        context.account,
        ethers.utils.parseEther("0.05"),
        context.account,
        0,
        maxSubmissionPrice,
        context.account,
        context.account,
        0,
        gasPriceBid,
        migrationCallData
      );

      // overpaying gas just in case
      // the excess will be sent back to the refund address
      const maxGas = estimatedGas.mul(4);

      // ethValue will be sent as callvalue
      // this entire amount will be used for successfully completing
      // the L2 side of the transaction
      // maxSubmissionPrice + totalGasPrice (estimatedGas * gasPrice)
      const ethValue = await maxSubmissionPrice.add(gasPriceBid.mul(maxGas));

      const signer = l1Migrator.connect(context.library.getSigner());

      const tx1 = await signer.migrateDelegator(
        context.account,
        context.account,
        "0x",
        maxGas,
        gasPriceBid,
        maxSubmissionPrice,
        {
          value: ethValue,
        }
      );

      setMigrationViewState({
        ...migrationViewState,
        step: 3,
        title: "Starting Migration",
        subtitle: `Confirming on ${CHAIN_INFO[L1_CHAIN_ID].label}`,
        mainnetTransactionHash: tx1.hash,
        loading: true,
      });

      await tx1.wait();

      start();

      setMigrationViewState({
        ...migrationViewState,
        step: 4,
        title: `En route to ${CHAIN_INFO[DEFAULT_CHAIN_ID].label}`,
        subtitle: `Estimated time remaining: ${minutes}:${seconds
          .toString()
          .padStart(2, "0")}`,
        mainnetTransactionHash: tx1.hash,
        loading: true,
      });

      // Ticket redemption hash is the one which has the L2 function call
      // L2 Tx Hash is just aliased L1 address redeeming ticket
      // users must be shown L2 Ticket Redemption hash
      const tx2 = await waitToRelayTxsToL2(
        waitForTx(tx1),
        CHAIN_INFO[DEFAULT_CHAIN_ID].contracts.inbox,
        l1Provider,
        l2Provider
      );

      setMigrationViewState({
        ...migrationViewState,
        step: 5,
        title: "Migration Complete",
        subtitle: null,
        loading: false,
        mainnetTransactionHash: tx1.hash,
        arbitrumTransactionHash: tx2.transactionHash,
        image: "/img/arbitrum.svg",
        showNetworkSwitcher: true,
        disclaimer: null,
      });
    } catch (e) {
      handleReset();
    }
  };

  const getSigningStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <TextField
              ref={register}
              size="3"
              name="signerAddress"
              placeholder="Ethereum Address"
            />
            {validSignerAddress && (
              <MigrationFields
                migrationParams={migrationParams}
                css={{ mt: "$3", mb: "$5" }}
              />
            )}
            {validSignerAddress && (
              <Button
                onClick={handleNext}
                size="4"
                variant="primary"
                css={{ mt: "$4" }}
              >
                Continue
              </Button>
            )}
          </Box>
        );
      case 1:
        if (!validSignerAddress) {
          return;
        }
        const domain = {
          name: "Livepeer L1Migrator",
          version: "1",
          chainId: L1_CHAIN_ID,
          verifyingContract: CHAIN_INFO[DEFAULT_CHAIN_ID].contracts.l1Migrator,
        };
        const types = {
          MigrateDelegator: [
            { name: "l1Addr", type: "address" },
            { name: "l2Addr", type: "address" },
          ],
        };
        const value = {
          l1Addr: validSignerAddress,
          l2Addr: validSignerAddress,
        };

        const payload = ethers.utils._TypedDataEncoder.getPayload(
          domain,
          types,
          value
        );
        let signer = "";

        if (signature) {
          try {
            signer = ethers.utils.verifyTypedData(
              domain,
              types,
              value,
              signature
            );
          } catch (e) {
            console.log(e);
          }
        }

        const validSignature =
          isValidAddress(signer) === isValidAddress(migrationParams.delegate);

        return (
          <Box>
            <Text css={{ mb: "$3" }}>
              Run the Livepeer CLI and select the option to &quot;Sign a
              message&quot;. When prompted for a message to sign, copy and paste
              the following message.
            </Text>

            <CodeBlock
              key={Math.random()}
              css={{ mb: "$4" }}
              showLineNumbers={false}
              id="message"
              variant="primary"
              isHighlightingLines={false}
            >
              {JSON.stringify(payload)}
            </CodeBlock>

            <Text css={{ mb: "$2" }}>
              The CLI will generate a signed message signature. It should begin
              with “0x”. Paste it here.
            </Text>
            <TextField
              ref={register}
              name="signature"
              placeholder="Signature"
              size="3"
            />
            {signature && (
              <Text size="1" css={{ mt: "$1", mb: "$1" }}>
                {validSignature
                  ? "Valid"
                  : `Invalid. Message must be signed by ${migrationParams.delegate}`}
              </Text>
            )}
            <Box>
              <Button
                disabled={!validSignature}
                variant={validSignature ? "primary" : "neutral"}
                onClick={handleNext}
                size="4"
                css={{ mt: "$4", mr: "$2" }}
              >
                Continue
              </Button>

              <Button onClick={handleBack} ghost size="4">
                Back
              </Button>
            </Box>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Text css={{ mb: "$3" }}>
              Approve migration on behalf of your orchestrator.
            </Text>
            {migrationParams && (
              <MigrationFields
                migrationParams={migrationParams}
                css={{ mb: "$5" }}
              />
            )}
            <Box>
              <Button
                size="4"
                variant="primary"
                css={{ mr: "$2" }}
                onClick={onApprove}
              >
                Approve Migration
              </Button>
              <Button onClick={handleBack} ghost size="4">
                Back
              </Button>
            </Box>
          </Box>
        );
      default:
        return "Unknown step";
    }
  };

  return (
    <Container
      size="2"
      css={{
        maxWidth: 650,
        mt: "$8",
        width: "100%",
        "@bp3": {
          width: 650,
        },
      }}
    >
      <Card
        css={{
          p: "$5",
          borderRadius: "$4",
          backgroundColor: "$panel",
          border: "1px solid $neutral3",
          mb: "$8",
        }}
      >
        <Box css={{ mb: "$6", maxWidth: 500, mx: "auto", textAlign: "center" }}>
          <Heading size="2" css={{ mb: "$2", fontWeight: 600 }}>
            {migrationViewState.title}
          </Heading>
          {migrationViewState?.subtitle && (
            <Text css={{ color: "$neutral11" }}>
              {migrationViewState.subtitle}
            </Text>
          )}
        </Box>

        {migrationViewState.image && (
          <Box css={{ textAlign: "center", mb: "$6" }}>
            <Box as="img" src={migrationViewState.image} />
          </Box>
        )}
        {migrationViewState.loading && (
          <Flex css={{ justifyContent: "center", mb: "$7" }}>
            <Spinner
              speed="1.5s"
              css={{
                width: 90,
                height: 90,
                maxWidth: 90,
                maxHeight: 90,
              }}
            />
          </Flex>
        )}
        {migrationViewState.mainnetTransactionHash && (
          <Box
            css={{
              jc: "center",
              display: "flex",
              ai: "center",
              mb: "$3",
            }}
          >
            <Text variant="neutral">Etherscan:</Text>
            <A
              css={{ ml: "$2", display: "flex", ai: "center" }}
              variant="primary"
              target="_blank"
              rel="noopener noreferrer"
              href={`${CHAIN_INFO[L1_CHAIN_ID].explorer}tx/${migrationViewState.mainnetTransactionHash}`}
            >
              {migrationViewState.mainnetTransactionHash.replace(
                migrationViewState.mainnetTransactionHash.slice(6, 62),
                "…"
              )}
              <Box as={ArrowTopRightIcon} />
            </A>
          </Box>
        )}
        {migrationViewState.arbitrumTransactionHash && (
          <Box
            css={{
              display: "flex",
              jc: "center",
              ai: "center",
              mb: "$3",
            }}
          >
            <Text variant="neutral">Arbiscan:</Text>
            <A
              css={{ ml: "$2", display: "flex", ai: "center" }}
              variant="primary"
              target="_blank"
              rel="noopener noreferrer"
              href={`${CHAIN_INFO[DEFAULT_CHAIN_ID].explorer}/tx/${migrationViewState.arbitrumTransactionHash}`}
            >
              {migrationViewState.arbitrumTransactionHash.replace(
                migrationViewState.arbitrumTransactionHash.slice(6, 62),
                "…"
              )}
              <Box as={ArrowTopRightIcon} />
            </A>
          </Box>
        )}
        {migrationViewState.step === 1 && !migrationViewState.isOrchestrator && (
          <Box css={stepperStyles}>
            <Stepper activeStep={activeStep} orientation="vertical">
              {signingSteps.map((step, index) => (
                <Step key={`step-${index}`}>
                  <Box
                    as={StepLabel}
                    optional={
                      index === 2 ? (
                        <Text variant="neutral" size="1">
                          Last step
                        </Text>
                      ) : null
                    }
                  >
                    {step}
                  </Box>
                  <StepContent TransitionProps={{ unmountOnExit: false }}>
                    {getSigningStepContent(index)}
                  </StepContent>
                </Step>
              ))}
            </Stepper>
          </Box>
        )}
        {migrationParams &&
          migrationViewState.isOrchestrator &&
          migrationViewState.step !== 5 &&
          migrationViewState.step !== 0 && (
            <MigrationFields
              migrationParams={migrationParams}
              css={{ mb: "$5" }}
            />
          )}
        {migrationViewState.step === 0 && (
          <WalletModal
            trigger={
              <Button variant="primary" size="4" css={{ width: "100%" }}>
                Connect Wallet
              </Button>
            }
          />
        )}
        {migrationViewState.step === 1 && migrationViewState.isOrchestrator && (
          <Button
            variant="primary"
            size="4"
            css={{ width: "100%" }}
            onClick={onApprove}
          >
            Approve Migration
          </Button>
        )}
        {migrationViewState.disclaimer && (
          <Text
            size="1"
            variant="neutral"
            css={{ mt: "$3", textAlign: "center" }}
          >
            Note: This migration will take about 10 minutes before it&apos;s
            considered final on Arbitrum.
          </Text>
        )}
      </Card>
    </Container>
  );
};

function MigrationFields({ migrationParams, css = {} }) {
  const ReadOnlyCard = styled(Box, {
    display: "flex",
    backgroundColor: "$neutral3",
    border: "1px solid $neutral6",
    borderRadius: "$3",
    color: "$netural5",
    justifyContent: "space-between",
    alignItems: "center",
    p: "$3",
  });

  return (
    <Box css={{ ...css }}>
      <ReadOnlyCard css={{ mb: "$2" }}>
        <Box css={{ fontWeight: 500, color: "$neutral10" }}>Address</Box>
        <Box>
          {migrationParams.delegate.replace(
            migrationParams.delegate.slice(6, 38),
            "…"
          )}
        </Box>
      </ReadOnlyCard>
      <ReadOnlyCard css={{ mb: "$2" }}>
        <Box css={{ fontWeight: 500, color: "$neutral10" }}>Self stake</Box>
        <Box>{ethers.utils.formatEther(migrationParams.stake)} LPT</Box>
      </ReadOnlyCard>
      <ReadOnlyCard css={{ mb: "$2" }}>
        <Box css={{ fontWeight: 500, color: "$neutral10" }}>
          Delegated Stake
        </Box>
        <Box>
          {ethers.utils.formatEther(migrationParams.delegatedStake)} LPT
        </Box>
      </ReadOnlyCard>
      <ReadOnlyCard>
        <Box css={{ fontWeight: 500, color: "$neutral10" }}>Earned fees</Box>
        <Box>{ethers.utils.formatEther(migrationParams.fees)} ETH</Box>
      </ReadOnlyCard>
    </Box>
  );
}

Migrate.getLayout = getLayout;

export default Migrate;
