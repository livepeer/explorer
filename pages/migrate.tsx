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
  useSnackbar,
} from "@livepeer/design-system";
import { getLayout } from "@layouts/main";
import { useEffect, useReducer, useState } from "react";
import Spinner from "@components/Spinner";
import { useWeb3React } from "@web3-react/core";
import WalletModal from "@components/WalletModal";
import { Step, StepContent, StepLabel, Stepper } from "@material-ui/core";
import { CodeBlock } from "@components/CodeBlock";
import { ethers } from "ethers";
import useForm from "react-hook-form";
import {
  arbRetryableTx,
  CHAIN_INFO,
  DEFAULT_CHAIN_ID,
  INFURA_NETWORK_URLS,
  l1Migrator,
  l1Provider,
  L1_CHAIN_ID,
  l2Provider,
  nodeInterface,
} from "constants/chains";
import { waitForTx, waitToRelayTxsToL2 } from "utils/messaging";
import LivepeerSDK from "@livepeer/sdk";
import { ArrowRightIcon, ArrowTopRightIcon } from "@modulz/radix-icons";
import { useTimer } from "react-timer-hook";
import { stepperStyles } from "../utils/stepperStyles";
import { isValidAddress } from "utils/validAddress";
import { isL2ChainId } from "@lib/chains";
import { useRouter } from "next/router";
import Link from "next/link";

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

const initialState = {
  title: `Migrate to ${CHAIN_INFO[DEFAULT_CHAIN_ID].label}`,
  stage: "connectWallet",
  body: (
    <Text variant="neutral" css={{ mb: "$5" }}>
      This tool will safely migrate your orchestrator&apos;s stake and fees to{" "}
      {CHAIN_INFO[DEFAULT_CHAIN_ID].label}.
    </Text>
  ),
  receipts: null,
  cta: (
    <WalletModal
      trigger={
        <Button variant="primary" size="4" css={{ width: "100%" }}>
          Connect Wallet
        </Button>
      }
    />
  ),
  image: "/img/arbitrum.svg",
  loading: false,
};

function reducer(state, action) {
  switch (action.type) {
    case "initialize":
      return {
        ...state,
        stage: "initialize",
        title: `Migrate to ${CHAIN_INFO[DEFAULT_CHAIN_ID].label}`,
        image: false,
        loading: false,
        receipts: null,
        body: (
          <Text variant="neutral" css={{ mb: "$5" }}>
            This tool will safely migrate your orchestrator&apos;s stake and
            fees to {CHAIN_INFO[DEFAULT_CHAIN_ID].label}.
          </Text>
        ),
        cta: false,
        footnote: `Note: This migration will take about 10 minutes before it's considered final on ${CHAIN_INFO[DEFAULT_CHAIN_ID].label}.`,
        ...action.payload,
      };
    case "initiate":
      return {
        ...state,
        stage: "initiate",
        loading: true,
        title: "Initiate Migration",
        body: (
          <Text variant="neutral" css={{ display: "block", mb: "$4" }}>
            Confirm the transaction in your wallet. Note that he gas estimate
            shown in your wallet will include both the L1 fee and a small amount
            of ETH to cover L2 execution.
          </Text>
        ),
        cta: false,
        ...action.payload,
      };
    case "starting":
      return {
        ...state,
        stage: "starting",
        title: "Starting Migration",
        body: (
          <Box css={{ mb: "$4" }}>
            <Text css={{ display: "block", color: "$neutral11", mb: "$4" }}>
              Confirming on {CHAIN_INFO[L1_CHAIN_ID].label}
            </Text>
          </Box>
        ),
        ...action.payload,
      };
    case "enRoute":
      return {
        ...state,
        stage: "enRoute",
        title: `En route to ${CHAIN_INFO[DEFAULT_CHAIN_ID].label}`,
        ...action.payload,
      };
    case "complete":
      return {
        ...state,
        stage: "complete",
        title: "Migration Complete",
        image: "/img/arbitrum.svg",
        body: (
          <Text variant="neutral" css={{ display: "block", mb: "$4" }}>
            Your stake and fees have been migrated to{" "}
            {CHAIN_INFO[DEFAULT_CHAIN_ID].label}.
          </Text>
        ),
        loading: false,
        footnote: false,
        ...action.payload,
      };
    case "inactive":
      return {
        ...state,
        ...initialState,
      };
    case "updateSigner":
      return {
        ...state,
        ...action.payload,
      };
    case "reset":
      return {
        ...state,
        stage: "initialize",
        title: `Migrate to ${CHAIN_INFO[DEFAULT_CHAIN_ID].label}`,
        image: false,
        loading: false,
        receipts: null,
        body: (
          <Text variant="neutral" css={{ mb: "$5" }}>
            This tool will safely migrate your orchestrator&apos;s stake and
            fees to {CHAIN_INFO[DEFAULT_CHAIN_ID].label}.
          </Text>
        ),
        ...action.payload,
      };
    default:
      return state;
  }
}

const Migrate = () => {
  const router = useRouter();
  const [state, dispatch] = useReducer(reducer, initialState);

  // Hack to get around flash of unstyled wallet connect
  useEffect(() => {
    setTimeout(() => {
      setRender(true);
    }, 1500);
  }, []);

  // Redirect if not on an L2
  useEffect(() => {
    if (!isL2ChainId(DEFAULT_CHAIN_ID)) {
      router.push("/");
    }
  }, [router]);

  const context = useWeb3React();
  const [openSnackbar] = useSnackbar();
  const [render, setRender] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const { register, watch, reset } = useForm();
  const signature = watch("signature");
  const signerAddress = watch("signerAddress");
  const time = new Date();
  time.setSeconds(time.getSeconds() + 600); // 10 minutes timer

  const { seconds, minutes, start, restart } = useTimer({
    autoStart: false,
    expiryTimestamp: time,
    onExpire: () => console.warn("onExpire called"),
  });

  useEffect(() => {
    if (!context.active) {
      dispatch({ type: "inactive" });
    }
  }, [context.active]);

  // update timer
  useEffect(() => {
    if (state.stage === "enRoute") {
      dispatch({
        type: "enRoute",
        payload: {
          body: (
            <Box css={{ mb: "$4" }}>
              <Text variant="neutral" css={{ display: "block", mb: "$4" }}>
                Estimated time remaining: {minutes}:
                {seconds.toString().padStart(2, "0")}
              </Text>
            </Box>
          ),
        },
      });
    }
  }, [state.stage, minutes, seconds]);

  const onApprove = async () => {
    try {
      dispatch({
        type: "initiate",
      });

      const gasPriceBid = await l2Provider.getGasPrice();

      // fetching submission price
      // https://developer.offchainlabs.com/docs/l1_l2_messages#parameters
      const [submissionPrice] = await arbRetryableTx.getSubmissionPrice(
        state.migrationCallData.length
      );

      // overpaying submission price to account for increase
      // https://developer.offchainlabs.com/docs/l1_l2_messages#important-note-about-base-submission-fee
      // the excess will be sent back to the refund address
      const maxSubmissionPrice = submissionPrice.mul(4);

      // calculating estimated gas for the tx
      const [estimatedGas] = await nodeInterface.estimateRetryableTicket(
        CHAIN_INFO[DEFAULT_CHAIN_ID].contracts.l1Migrator,
        ethers.utils.parseEther("0.01"),
        CHAIN_INFO[DEFAULT_CHAIN_ID].contracts.l2Migrator,
        0,
        maxSubmissionPrice,
        context.account,
        context.account,
        0,
        gasPriceBid,
        state.migrationCallData
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
        state.signer ? state.signer : context.account,
        state.signer ? state.signer : context.account,
        signature ? signature : "0x",
        maxGas,
        gasPriceBid,
        maxSubmissionPrice,
        {
          value: ethValue,
        }
      );
      dispatch({
        type: "starting",
        payload: {
          receipts: {
            l1: tx1.hash,
          },
        },
      });

      await tx1.wait();

      // start timer
      start();

      dispatch({
        type: "enRoute",
        payload: {
          body: (
            <Box css={{ mb: "$4" }}>
              <Text variant="neutral" css={{ display: "block", mb: "$4" }}>
                Estimated time remaining: {minutes}:
                {seconds.toString().padStart(2, "0")}
              </Text>
            </Box>
          ),
        },
      });

      const tx2 = await waitToRelayTxsToL2(
        waitForTx(tx1),
        CHAIN_INFO[DEFAULT_CHAIN_ID].contracts.inbox,
        l1Provider,
        l2Provider
      );

      dispatch({
        type: "complete",
        payload: {
          receipts: {
            l1: tx1.hash,
            l2: tx2.transactionHash,
          },
          cta: (
            <Box css={{ textAlign: "center" }}>
              <Link
                href={`/accounts/${
                  state.signer ? state.signer : context.account
                }/delegating`}
                passHref
              >
                <Button
                  as="A"
                  variant="primary"
                  size="4"
                  css={{
                    display: "inline-flex",
                    ai: "center",
                    mt: "$2",
                    mb: "$2",
                  }}
                >
                  View account on {CHAIN_INFO[DEFAULT_CHAIN_ID].label}
                  <Box as={ArrowRightIcon} css={{ ml: "$2" }} />
                </Button>
              </Link>
            </Box>
          ),
          loading: false,
          footnote: null,
        },
      });
    } catch (e) {
      console.log(e);
      openSnackbar(e.message);
      handleReset();
    }
  };

  useEffect(() => {
    const init = async () => {
      if (context.account) {
        const isOrchestrator = await isRegisteredOrchestrator(context.account);
        // fetch calldata to be submitted for calling L2 function
        const { data, params } = await l1Migrator.getMigrateDelegatorParams(
          state.signer ? state.signer : context.account,
          state.signer ? state.signer : context.account
        );

        dispatch({
          type: "initialize",
          payload: {
            isOrchestrator,
            migrationCallData: data,
            migrationParams: {
              delegate: params.delegate,
              delegatedStake: params.delegatedStake,
              stake: params.stake,
              fees: params.fees,
              l1Addr: params.l1Addr,
              l2Addr: params.l2Addr,
            },
          },
        });
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.signer, context.account]);

  useEffect(() => {
    const init = async () => {
      if (isValidAddress(signerAddress)) {
        if (!state.isOrchestrator) {
          dispatch({
            type: "updateSigner",
            payload: {
              signer: isValidAddress(signerAddress),
            },
          });
        } else {
          dispatch({
            type: "updateSigner",
            payload: {
              signer: null,
            },
          });
        }
      } else {
        dispatch({
          type: "updateSigner",
          payload: {
            signer: null,
          },
        });
      }
    };
    init();
  }, [signerAddress, context.chainId, state.isOrchestrator]);

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
    dispatch({
      type: "reset",
    });
  };

  if (!render) {
    return (
      <Flex
        align="center"
        justify="center"
        css={{ height: "calc(100vh - 61px)" }}
      >
        <Spinner />
      </Flex>
    );
  }

  const getSigningStepContent = (activeStep) => {
    switch (activeStep) {
      case 0:
        return (
          <Box>
            <TextField
              ref={register}
              size="3"
              name="signerAddress"
              placeholder="Ethereum Address"
            />
            {state.signer && (
              <MigrationFields
                migrationParams={state.migrationParams}
                css={{ mt: "$3", mb: "$5" }}
              />
            )}
            {state.signer && (
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
        if (!state.signer) {
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
          l1Addr: state.signer,
          l2Addr: state.signer,
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
          isValidAddress(signer) ===
          isValidAddress(state.migrationParams.delegate);

        return (
          <Box>
            <Text css={{ mb: "$3" }}>
              Run the Livepeer CLI and select the option to &quot;Sign typed
              data&quot;. When prompted for the typed data message to sign, copy
              and paste the following message.
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
                  : `Invalid. Message must be signed by ${state.migrationParams.delegate}`}
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
            {state.migrationParams && (
              <MigrationFields
                migrationParams={state.migrationParams}
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
          pt: "$5",
          borderRadius: "$4",
          backgroundColor: "$panel",
          border: "1px solid $neutral5",
          mb: "$8",
        }}
      >
        <Box css={{ px: "$5" }}>
          <Box css={{ mx: "auto", textAlign: "center" }}>
            <Heading size="2" css={{ mb: "$2", fontWeight: 600 }}>
              {state.title}
            </Heading>
            {state?.body && <Box>{state.body}</Box>}

            {state.image && (
              <Box css={{ textAlign: "center", mb: "$5" }}>
                <Box as="img" src="/img/arbitrum.svg" />
              </Box>
            )}

            {state.stage === "initialize" && state.isOrchestrator && (
              <MigrationFields
                migrationParams={state.migrationParams}
                css={{ mb: "$5" }}
              />
            )}

            <Box
              css={{
                display:
                  state.stage === "initialize" && !state.isOrchestrator
                    ? "block"
                    : "none",
              }}
            >
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
            </Box>
          </Box>

          {state.loading && (
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
          {state?.receipts && (
            <Box css={{ mb: "$4" }}>
              {state?.receipts?.l1 && (
                <ReceiptLink
                  label="Etherscan"
                  chainId={L1_CHAIN_ID}
                  hash={state.receipts.l1}
                />
              )}

              {state?.receipts?.l2 && (
                <ReceiptLink
                  label="Arbiscan"
                  chainId={DEFAULT_CHAIN_ID}
                  hash={state.receipts.l2}
                />
              )}
            </Box>
          )}
          {state.cta}
          {state.stage === "initialize" && state.isOrchestrator && (
            <Button
              size="4"
              variant="primary"
              css={{ mr: "$2", width: "100%" }}
              onClick={onApprove}
            >
              Approve Migration
            </Button>
          )}
          {state.footnote && (
            <Text
              size="1"
              variant="neutral"
              css={{ mt: "$3", textAlign: "center" }}
            >
              {state.footnote}
            </Text>
          )}
        </Box>
        <Flex
          align="center"
          justify="center"
          direction="column"
          css={{
            px: "$4",
            py: "$3",
            borderTop: "1px dashed $neutral4",
            textAlign: "center",
            mt: "$5",
          }}
        >
          <Button
            css={{ bottom: 20, right: 20 }}
            as="a"
            href="https://docs.livepeer.org/video-miners/how-to-guides/l2-migration"
            target="_blank"
            size="3"
            ghost
          >
            Migration Guide
            <Box css={{ ml: "$1" }} as={ArrowTopRightIcon} />
          </Button>
          <Button
            css={{ bottom: 20, right: 20 }}
            as="a"
            href="https://discord.gg/XYJ7aVNqkS"
            target="_blank"
            size="3"
            ghost
          >
            Discord Support Channel{" "}
            <Box css={{ ml: "$1" }} as={ArrowTopRightIcon} />
          </Button>
        </Flex>
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

function ReceiptLink({ label, hash, chainId }) {
  return (
    <Box
      css={{
        jc: "center",
        display: "flex",
        ai: "center",
      }}
    >
      <Text variant="neutral">{label}:</Text>
      <A
        css={{ ml: "$2", display: "flex", ai: "center" }}
        variant="primary"
        target="_blank"
        rel="noopener noreferrer"
        href={`${CHAIN_INFO[chainId].explorer}tx/${hash}`}
      >
        {hash.replace(hash.slice(6, 62), "…")}
        <Box as={ArrowTopRightIcon} />
      </A>
    </Box>
  );
}
