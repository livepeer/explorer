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
} from "@livepeer/design-system";
import { getLayout } from "@layouts/main";
import { useEffect, useState } from "react";
import Spinner from "@components/Spinner";
import { useWeb3React } from "@web3-react/core";
import WalletModal from "@components/WalletModal";
import { Step, StepContent, StepLabel, Stepper } from "@material-ui/core";
import { CodeBlock } from "@components/CodeBlock";
import { ethers } from "ethers";
import migratorABI from "../abis/L1Migrator.json";
import arbRetryableTxABI from "../abis/ArbRetryableTx.json";
import nodeInterfaceABI from "../abis/NodeInterface.json";
import {
  CHAIN_INFO,
  DEFAULT_CHAIN_ID,
  INFURA_NETWORK_URLS,
} from "constants/chains";
import { waitForTx, waitToRelayTxsToL2 } from "utils/messaging";

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
  finalized?: boolean;
};

const signingSteps = [
  "Enter orchestrator Ethereum Address",
  "Sign message",
  "Approve migration",
];

const stepperStyles = {
  mb: "$5",
  ".MuiPaper-root": {
    backgroundColor: "$inherit",
    color: "$hiContrast",
    p: 0,
    "@bp3": {
      px: "$4",
    },
  },
  ".MuiStepIcon-root": {
    color: "$neutral9",
  },
  ".MuiStepIcon-root.MuiStepIcon-active": {
    color: "$primary11",
  },
  ".MuiStepIcon-text": {
    fill: "$loContrast",
  },
  ".MuiStepLabel-label": {
    color: "$neutral11",
  },
  ".MuiStepLabel-label.MuiStepLabel-completed": {
    color: "$hiContrast",
  },
  ".MuiStepIcon-root.MuiStepIcon-completed": {
    color: "$primary11",
  },
  ".MuiStepLabel-label.MuiStepLabel-active": {
    color: "$hiContrast",
  },
};

const Migrate = () => {
  const context = useWeb3React();
  const [activeStep, setActiveStep] = useState(0);
  const [migrationParams, setMigrationParams] = useState(undefined);
  const [migrationCallData, setMigrationCallData] = useState(undefined);
  const [migrationViewState, setMigrationViewState] = useState<
    MigrationState | undefined
  >({
    step: 0,
    title: `Migrate Rinkeby Stake & Fees to Arbitrum Rinkeby`,
    subtitle:
      "This tool will safely migrate your orchestrator’s stake and fees from Rinkeby to Arbitrum Rinkeby.",
    loading: false,
    image: "/img/arbitrum.svg",
  });

  const L1_CHAIN_ID = CHAIN_INFO[DEFAULT_CHAIN_ID].l1;

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

  useEffect(() => {
    const init = async () => {
      try {
        // fetch calldata to be submitted for calling L2 function
        const { data, params } = await l1Migrator.getMigrateDelegatorParams(
          context.account,
          context.account
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
      } catch (e) {
        console.log(e);
      }
    };
    if (context.account) {
      init();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context.account, context.chainId]);

  useEffect(() => {
    if (!context.account) {
      setMigrationViewState({
        step: 0,
        title: `Migrate Rinkeby Stake & Fees to Arbitrum Rinkeby`,
        subtitle:
          "This tool will safely migrate your orchestrator’s stake and fees from Rinkeby to Arbitrum Rinkeby.",
        loading: false,
        image: "/img/arbitrum.svg",
      });
    }
    if (context.account) {
      if (migrationViewState.step === 0) {
        setMigrationViewState({
          step: 1,
          title: `Migrate Rinkeby Stake & Fees to Arbitrum Rinkeby`,
          subtitle:
            "This tool will safely migrate your orchestrator’s stake and fees from Rinkeby to Arbitrum Rinkeby.",
          loading: false,
          isOrchestrator: true,
          disclaimer:
            "Note: This migration will take about 10 minutes before it’s considered final on Arbitrum.",
        });
      }
    }
  }, [migrationViewState.step, context.account]);

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
  };

  const onApprove = async () => {
    setMigrationViewState({
      step: 2,
      title: "Initiate Migration",
      subtitle: "Confirm the transaction in your wallet.",
      loading: true,
      disclaimer:
        "Note: This migration will take about 10 minutes before it’s considered final on Arbitrum.",
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
    const promise = signer.migrateDelegator(
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
      step: 3,
      title: "Starting Migration",
      subtitle: "Confirming on Mainnet",
      loading: true,
      mainnetTransactionHash:
        "0xa9d96ebcf955b6760ea4ada915639451de0e3194a376ebcbbb2f88dcc9a26558",
      disclaimer:
        "Note: This migration will take about 10 minutes before it’s considered final on Arbitrum.",
    });

    const tx = await promise;
    console.log("tx", tx);

    setMigrationViewState({
      step: 4,
      title: "En enroute to Arbitrum",
      subtitle: "Estimated arrival time: 9 minutes",
      loading: true,
      mainnetTransactionHash:
        "0xa9d96ebcf955b6760ea4ada915639451de0e3194a376ebcbbb2f88dcc9a26558",
      arbitrumTransactionHash:
        "0xa9d96ebcf955b6760ea4ada915639451de0e3194a376ebcbbb2f88dcc9a26558",
      disclaimer:
        "Note: This migration will take about 10 minutes before it’s considered final on Arbitrum.",
    });

    // Ticket redemption hash is the one which has the L2 function call
    // L2 Tx Hash is just aliased L1 address redeeming ticket
    // users must be shown L2 Ticket Redemption hash
    const tx2 = await waitToRelayTxsToL2(
      waitForTx(tx),
      CHAIN_INFO[DEFAULT_CHAIN_ID].contracts.inbox,
      l1Provider,
      l2Provider
    );
    console.log("tx2", tx2);
    setMigrationViewState({
      step: 5,
      title: "Migration Complete",
      subtitle: null,
      loading: false,
      mainnetTransactionHash:
        "0xa9d96ebcf955b6760ea4ada915639451de0e3194a376ebcbbb2f88dcc9a26558",
      arbitrumTransactionHash:
        "0xa9d96ebcf955b6760ea4ada915639451de0e3194a376ebcbbb2f88dcc9a26558",
      image: "/img/arbitrum.svg",
      showNetworkSwitcher: true,
      disclaimer: null,
      finalized: true,
    });
  };

  const getSigningStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <TextField size="3" placeholder="Ethereum Address" />
            <Button
              onClick={handleNext}
              size="4"
              variant="primary"
              css={{ mt: "$4" }}
            >
              Continue
            </Button>
          </Box>
        );
      case 1:
        return (
          <Box>
            <Text css={{ mb: "$3" }}>
              Run the Livepeer CLI and select the option to &quot;Sign a
              message&quot;. When prompted for a message to sign, copy and paste
              the following message.
            </Text>

            <CodeBlock
              css={{ mb: "$4" }}
              showLineNumbers={false}
              id="message"
              variant="primary"
              isHighlightingLines={false}
            >
              bafyreicpviw2f3aby4wud6iozjtbgcmy3dulvztwpcsjsxvpfmasdfa324bafyreicpviw2f3aby4wud6iozjtbgcmy3dulvztw
            </CodeBlock>
            <Text css={{ mb: "$2" }}>
              The CLI will generate a signed message signature. It should begin
              with “0x”. Paste it here.
            </Text>
            <TextField placeholder="Signature" size="3" />
            <Box>
              <Button
                onClick={handleNext}
                size="4"
                variant="primary"
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
            <Box css={{ mb: "$5" }}>
              <ReadOnlyCard css={{ mb: "$2" }}>
                <Box css={{ fontWeight: 500, color: "$neutral10" }}>
                  Address
                </Box>
                <Box>0x212a</Box>
              </ReadOnlyCard>
              <ReadOnlyCard css={{ mb: "$2" }}>
                <Box css={{ fontWeight: 500, color: "$neutral10" }}>
                  Self stake
                </Box>
                <Box>100 LPT</Box>
              </ReadOnlyCard>
              <ReadOnlyCard css={{ mb: "$2" }}>
                <Box css={{ fontWeight: 500, color: "$neutral10" }}>
                  Delegated Stake
                </Box>
                <Box>200 LPT</Box>
              </ReadOnlyCard>
              <ReadOnlyCard>
                <Box css={{ fontWeight: 500, color: "$neutral10" }}>
                  Earned fees
                </Box>
                <Box>1.2 ETH</Box>
              </ReadOnlyCard>
            </Box>
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
                  <StepContent>{getSigningStepContent(index)}</StepContent>
                </Step>
              ))}
            </Stepper>
          </Box>
        )}

        {migrationParams &&
          migrationViewState.isOrchestrator &&
          migrationViewState.step !== 5 &&
          migrationViewState.step !== 0 && (
            <>
              <Box css={{ mb: "$5" }}>
                <ReadOnlyCard css={{ mb: "$2" }}>
                  <Box css={{ fontWeight: 500, color: "$neutral10" }}>
                    Address
                  </Box>
                  <Box>
                    {migrationParams.delegate.replace(
                      migrationParams.delegate.slice(6, 38),
                      "…"
                    )}
                  </Box>
                </ReadOnlyCard>
                <ReadOnlyCard css={{ mb: "$2" }}>
                  <Box css={{ fontWeight: 500, color: "$neutral10" }}>
                    Self stake
                  </Box>
                  <Box>
                    {ethers.utils.formatEther(migrationParams.stake)} LPT
                  </Box>
                </ReadOnlyCard>
                <ReadOnlyCard css={{ mb: "$2" }}>
                  <Box css={{ fontWeight: 500, color: "$neutral10" }}>
                    Delegated Stake
                  </Box>
                  <Box>
                    {ethers.utils.formatEther(migrationParams.delegatedStake)}{" "}
                    LPT
                  </Box>
                </ReadOnlyCard>
                <ReadOnlyCard>
                  <Box css={{ fontWeight: 500, color: "$neutral10" }}>
                    Earned fees
                  </Box>
                  <Box>
                    {ethers.utils.formatEther(migrationParams.fees)} ETH
                  </Box>
                </ReadOnlyCard>
              </Box>
            </>
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
            Note: This migration will take about 10 minutes before it’s
            considered final on Arbitrum.
          </Text>
        )}
      </Card>
    </Container>
  );
};

Migrate.getLayout = getLayout;

export default Migrate;
