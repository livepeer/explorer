import {
  Box,
  Flex,
  Heading,
  Text,
  Container,
  Card,
  styled,
  Button,
  Code,
  IconButton,
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
import arbRetryableTxABI from "../abis/arbRetryableTx.json";
import nodeInterfaceABI from "../abis/nodeInterface.json";
import l2MigratorABI from "../abis/L2Migrator.json";
import { CHAIN_INFO } from "constants/chains";

const MIGRATOR_ADDRESS_RINKEBY = "0x7cfB164BDdB051da1CF6d66B1395dA0FBB18E749";
const BONDING_MANAGER_RINKEBY = "0x595ab11a0bffbca8134d2105bcf985e85732af5c";
const CONTROLLER_RINKEBY = "0x4f1a76b331b3bdd4a5351a21510119738310cf55";
const L2MIGRATOR_RINKEBY = "0x49a8B5Fbe9AC1ddcE947d951a36376A33f7d5c19";

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

const dummyStateData = [
  {
    step: 0,
    title: "Migrate Stake to Arbitrum",
    subtitle:
      "This tool will safely migrate your orchestrator’s delegated stake and fees from Ethereum Mainnet to Arbitrum.",
    loading: false,
    image: "/img/arbitrum.svg",
  },
  {
    step: 1,
    title: "Migrate Stake to Arbitrum",
    subtitle:
      "This tool will safely migrate your orchestrator’s stake and fees from Ethereum Mainnet to Arbitrum.",
    loading: false,
    isOrchestrator: true,
    disclaimer:
      "Note: This migration will take about 10 minutes before it’s considered final on Arbitrum.",
  },
  {
    step: 2,
    title: "Initiate Migration",
    subtitle: "Confirm the transaction in your wallet.",
    loading: true,
    disclaimer:
      "Note: This migration will take about 10 minutes before it’s considered final on Arbitrum.",
  },
  {
    step: 3,
    title: "Starting Migration",
    subtitle: "Confirming on Mainnet",
    loading: true,
    mainnetTransactionHash:
      "0xa9d96ebcf955b6760ea4ada915639451de0e3194a376ebcbbb2f88dcc9a26558",
    disclaimer:
      "Note: This migration will take about 10 minutes before it’s considered final on Arbitrum.",
  },
  {
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
  },
  {
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
  },
];

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

function getArbitrumCoreContracts(l2) {
  return {
    arbRetryableTx: new ethers.Contract(
      CHAIN_INFO[process.env.NEXT_PUBLIC_NETWORK].contracts.arbRetryableTx,
      arbRetryableTxABI,
      l2
    ),
    nodeInterface: new ethers.Contract(
      CHAIN_INFO[process.env.NEXT_PUBLIC_NETWORK].contracts.nodeInterface,
      nodeInterfaceABI,
      l2
    ),
  };
}

const Migrate = () => {
  const context = useWeb3React();
  const [activeStep, setActiveStep] = useState(0);
  const [l1Migrator, setL1Migrator] = useState(null);
  const [migrationViewState, setMigrationViewState] = useState(
    dummyStateData[0]
  );

  const arbProvider = new ethers.providers.JsonRpcProvider(
    process.env.NEXT_PUBLIC_RPC_ARB_RINKEBY_URL
  );

  useEffect(() => {
    if (context.library) {
      const l1Migrator = new ethers.Contract(
        MIGRATOR_ADDRESS_RINKEBY,
        migratorABI,
        context.library
      );
      setL1Migrator(l1Migrator);
    }
  }, [context.library]);

  // const bondingManager = new ethers.Contract(
  //   BONDING_MANAGER_RINKEBY,
  //   bondingManagerABI,
  //   context.library.provider
  // );

  const l2Migrator = new ethers.Contract(
    L2MIGRATOR_RINKEBY,
    l2MigratorABI,
    arbProvider
  );

  useEffect(() => {
    if (!context.account) {
      setMigrationViewState({
        step: 0,
        title: "Migrate Stake to Arbitrum",
        subtitle:
          "This tool will safely migrate your orchestrator’s stake and fees from Ethereum Mainnet to Arbitrum.",
        loading: false,
        image: "/img/arbitrum.svg",
      });
    }
    if (context.account) {
      if (migrationViewState.step === 0) {
        setMigrationViewState(dummyStateData[1]);
      }
    }
  }, [context.account]);

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
    const seqNo = 7;
    const stake = 100;
    const fees = 200;
    const delegatedStake = 300;
    const delegate = context.account;

    const migrateDelegatorParams = {
      l1Addr: context.account,
      l2Addr: context.account,
      stake,
      delegatedStake,
      fees,
      delegate,
    };

    const l2Calldata = l2Migrator.interface.encodeFunctionData(
      "finalizeMigrateDelegator",
      [migrateDelegatorParams]
    );

    const gasPriceBid = await arbProvider.getGasPrice();

    const [submissionPrice] = await getArbitrumCoreContracts(
      arbProvider
    ).arbRetryableTx.getSubmissionPrice(l2Calldata.length);
    const maxSubmissionPrice = submissionPrice.mul(4);

    const [estimatedGas] = await getArbitrumCoreContracts(
      arbProvider
    ).nodeInterface.estimateRetryableTicket(
      context.account,
      ethers.utils.parseEther("0.05"),
      context.account,
      0,
      maxSubmissionPrice,
      context.account,
      context.account,
      0,
      gasPriceBid,
      l2Calldata
    );
    const maxGas = estimatedGas.mul(4);

    const signer = l1Migrator.connect(context.library.getSigner());
    const tx = await signer.migrateDelegator(
      context.account,
      context.account,
      "0x",
      maxGas,
      gasPriceBid,
      maxSubmissionPrice
    );
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
              Run the Livepeer CLI and select the option to "Sign a message".
              When prompted for a message to sign, copy and paste the following
              message.
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
                onClick={async () => {
                  // const seqNo = 7;
                  // const stake = 100;
                  // const fees = 200;
                  // const delegatedStake = 300;
                  // const delegate = context.account;
                  // const migrateDelegatorParams = {
                  //   l1Addr: context.account,
                  //   l2Addr: context.account,
                  //   stake,
                  //   delegatedStake,
                  //   fees,
                  //   delegate,
                  // };
                  // const l2Calldata = l2Migrator
                  //   .createInterface()
                  //   .encodeFunctionData("finalizeMigrateDelegator", [
                  //     migrateDelegatorParams,
                  //   ]);
                  // const gasPriceBid = await arbProvider.getGasPrice();
                  // const [submissionPrice] = await getArbitrumCoreContracts(
                  //   arbProvider
                  // ).arbRetryableTx.getSubmissionPrice(l2Calldata.length);
                  // const maxSubmissionPrice = submissionPrice.mul(4);
                  // const [estimatedGas] = await getArbitrumCoreContracts(
                  //   arbProvider
                  // ).nodeInterface.estimateRetryableTicket(
                  //   context.account,
                  //   ethers.utils.parseEther("0.05"),
                  //   context.account,
                  //   0,
                  //   maxSubmissionPrice,
                  //   context.account,
                  //   context.account,
                  //   0,
                  //   gasPriceBid,
                  //   l2Calldata
                  // );
                  // const maxGas = estimatedGas.mul(4);
                  // const signer = l1Migrator.connect(
                  //   context.library.getSigner()
                  // );
                  // const tx = await signer.migrateDelegator(
                  //   context.account,
                  //   context.account,
                  //   "0x",
                  //   maxGas,
                  //   gasPriceBid,
                  //   maxSubmissionPrice
                  // );
                  //setMigrationViewState(dummyStateData[2]);
                }}
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

        {migrationViewState.isOrchestrator &&
          migrationViewState.step !== 5 &&
          migrationViewState.step !== 0 && (
            <>
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
