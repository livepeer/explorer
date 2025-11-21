import { CodeBlock } from "@components/CodeBlock";
import Spinner from "@components/Spinner";
import { getLayout } from "@layouts/main";
import { l1Migrator } from "@lib/api/abis/bridge/L1Migrator";
import { getL1MigratorAddress } from "@lib/api/contracts";
import { isL2ChainId, l1PublicClient, l2PublicClient } from "@lib/chains";
import {
  Box,
  Button,
  Card,
  Container,
  Flex,
  Heading,
  Link as A,
  styled,
  Text,
  TextField,
  useSnackbar,
} from "@livepeer/design-system";
import { ArrowTopRightIcon } from "@modulz/radix-icons";
import { ethers } from "ethers";
import { useAccountAddress, useActiveChain, useL1DelegatorData } from "hooks";
import { useEffect, useReducer, useState } from "react";

import {
  CHAIN_INFO,
  DEFAULT_CHAIN_ID,
  L1_CHAIN_ID,
} from "lib/chains";
import { useRouter } from "next/router";
import useForm from "react-hook-form";
import { useTimer } from "react-timer-hook";
import { getAddress, isAddress } from "viem";
import { inbox } from "@lib/api/abis/bridge/Inbox";
import { nodeInterface } from "@lib/api/abis/bridge/NodeInterface";
import { useWriteContract } from "wagmi";
import { waitToRelayTxsToL2 } from "utils/messaging";
import Link from "next/link";
import { ArrowRightIcon } from "@radix-ui/react-icons";

import { stepperStyles } from "../../utils/stepperStyles";
import { Step, StepContent, StepLabel, Stepper } from "@mui/material";

const signingSteps = [
  "Enter orchestrator Ethereum Address",
  "Sign message",
  "Approve migration",
];

const initialState = {
  title: `Migrate Orchestrator to ${CHAIN_INFO[DEFAULT_CHAIN_ID].label}`,
  stage: "connectWallet",
  body: (
    <Text variant="neutral" css={{ marginBottom: "$5" }}>
      This tool will safely migrate your orchestrator&apos;s stake and fees to{" "}
      {CHAIN_INFO[DEFAULT_CHAIN_ID].label}.
    </Text>
  ),
  receipts: null,
  cta: (
    <Flex align="center" direction="column">
      <Button
        size="4"
        disabled={true}
        variant="primary"
        css={{ width: "100%" }}
      >
        Migrate Orchestrator
      </Button>
      <Text
        size="2"
        css={{ marginTop: "$2", fontWeight: 600, color: "$red11" }}
      >
        Connect your wallet to continue.
      </Text>
    </Flex>
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
        title: `Migrate Orchestrator to ${CHAIN_INFO[DEFAULT_CHAIN_ID].label}`,
        image: false,
        loading: false,
        receipts: null,
        body: (
          <Text variant="neutral" css={{ marginBottom: "$5" }}>
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
          <Text
            variant="neutral"
            css={{ display: "block", marginBottom: "$4" }}
          >
            Confirm the transaction in your wallet. Note that the gas estimate
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
          <Box css={{ marginBottom: "$4" }}>
            <Text
              css={{
                display: "block",
                color: "$neutral11",
                marginBottom: "$4",
              }}
            >
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
          <Text
            variant="neutral"
            css={{ display: "block", marginBottom: "$4" }}
          >
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
        title: `Migrate Orchestrator to ${CHAIN_INFO[DEFAULT_CHAIN_ID].label}`,
        image: false,
        loading: false,
        receipts: null,
        body: (
          <Text variant="neutral" css={{ marginBottom: "$5" }}>
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

const l1MigratorAddress = getL1MigratorAddress();

const MigrateOrchestrator = () => {
  const router = useRouter();
  const [state, dispatch] = useReducer(reducer, initialState);
  const { writeContractAsync } = useWriteContract();

  // Hack to get around flash of unstyled wallet connect
  useEffect(() => {
    setTimeout(() => {
      setRender(true);
    }, 2000);
  }, []);

  // Redirect if not on an L2
  useEffect(() => {
    if (!isL2ChainId(DEFAULT_CHAIN_ID)) {
      router.push("/");
    }
  }, [router]);

  const activeChain = useActiveChain();
  const accountAddress = useAccountAddress();

  const [openSnackbar] = useSnackbar();
  const [render, setRender] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const { register, watch } = useForm();
  const signature = watch("signature");
  const signerAddress = watch("signerAddress");
  const time = new Date();
  time.setSeconds(time.getSeconds() + 600); // 10 minutes timer

  const { start } = useTimer({
    autoStart: false,
    expiryTimestamp: time,
    onExpire: () => console.warn("onExpire called"),
  });

  const l1Delegator = useL1DelegatorData(accountAddress);

  const { seconds, minutes, restart } = useTimer({
    autoStart: false,
    expiryTimestamp: time,
    onExpire: () => console.warn("onExpire called"),
  });

  useEffect(() => {
    if (!accountAddress) {
      dispatch({ type: "inactive" });
    }
  }, [accountAddress]);

  // update timer
  useEffect(() => {
    if (state.stage === "enRoute") {
      dispatch({
        type: "enRoute",
        payload: {
          body: (
            <Box css={{ marginBottom: "$4" }}>
              <Text
                variant="neutral"
                css={{ display: "block", marginBottom: "$4" }}
              >
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
      if (!accountAddress) {
        throw new Error("Account address is required");
      }

      dispatch({
        type: "initiate",
      });

      const gasPriceBid = await l2PublicClient.getGasPrice();

      // fetching submission price
      // https://developer.offchainlabs.com/docs/l1_l2_messages#parameters
      const submissionPrice = await l1PublicClient.readContract({
        address: CHAIN_INFO[DEFAULT_CHAIN_ID].contracts.inbox,
        abi: inbox,
        functionName: "calculateRetryableSubmissionFee",
        args: [
          state.migrationCallData.length,
          gasPriceBid, // TODO change this to 0 to use the block.basefee once Nitro upgrades
        ],
      });

      // overpaying submission price to account for increase
      // https://developer.offchainlabs.com/docs/l1_l2_messages#important-note-about-base-submission-fee
      // the excess will be sent back to the refund address
      const maxSubmissionPrice = submissionPrice * 4n;

      // calculating estimated gas for the tx
      const estimatedGas =
        await l1PublicClient.estimateContractGas({
          address: CHAIN_INFO[DEFAULT_CHAIN_ID].contracts.nodeInterface,
          abi: nodeInterface,
          functionName: "estimateRetryableTicket",
          args: [
          CHAIN_INFO[DEFAULT_CHAIN_ID].contracts.l1Migrator,
          ethers.utils.parseEther("0.01").toBigInt(),
          CHAIN_INFO[DEFAULT_CHAIN_ID].contracts.l2Migrator,
          0n,
          accountAddress,
          accountAddress,
          state.migrationCallData,
        ],
      });

      // overpaying gas just in case
      // the excess will be sent back to the refund address
      const maxGas = estimatedGas * 4n;

      // ethValue will be sent as callvalue
      // this entire amount will be used for successfully completing
      // the L2 side of the transaction
      // maxSubmissionPrice + totalGasPrice (estimatedGas * gasPrice)
      const ethValue = maxSubmissionPrice + gasPriceBid * maxGas;

      const migrateOrchestratorTx = await writeContractAsync({
        address: CHAIN_INFO[DEFAULT_CHAIN_ID].contracts.l1Migrator,
        abi: l1Migrator,
        functionName: "migrateDelegator",
        args: [
          accountAddress,
          accountAddress,
          signature ? signature : "0x",
          maxGas,
          gasPriceBid,
          maxSubmissionPrice,
        ],
        value: ethValue,
      });

      dispatch({
        type: "starting",
        payload: {
          receipts: {
            l1: migrateOrchestratorTx,
          },
        },
      });

      const txReceipt = await l1PublicClient.waitForTransactionReceipt({
        hash: migrateOrchestratorTx as `0x${string}`,
      });

      // start timer
      start();

      dispatch({
        type: "enRoute",
        payload: {
          body: (
            <Box css={{ marginBottom: "$4" }}>
              <Text variant="neutral" css={{ display: "block", marginBottom: "$4" }}>
                Estimated time remaining: {minutes}:
                {seconds.toString().padStart(2, "0")}
              </Text>
            </Box>
          ),
        },
      });

      const tx2 = await waitToRelayTxsToL2(
        // @ts-expect-error Incorrect type between ethers and viem transaction receipt
        Promise.resolve(txReceipt),
        CHAIN_INFO[DEFAULT_CHAIN_ID].contracts.inbox,
        l1PublicClient,
        l2PublicClient
      );

      dispatch({
        type: "complete",
        payload: {
          receipts: {
            l1: migrateOrchestratorTx,
            l2: tx2.transactionHash,
          },
          cta: (
            <Box css={{ textAlign: "center" }}>
              <Link
                href={`/accounts/${
                  state.signer ? state.signer : accountAddress
                }/delegating`}
                passHref
              >
                <Button
                  as="a"
                  variant="primary"
                  size="4"
                  css={{
                    display: "inline-flex",
                    alignItems: "center",
                    marginTop: "$2",
                    marginBottom: "$2",
                  }}
                >
                  View account on {CHAIN_INFO[DEFAULT_CHAIN_ID].label}
                  <Box as={ArrowRightIcon} css={{ marginLeft: "$2" }} />
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
      openSnackbar((e as Error).message);
      handleReset();
    }
  };

  useEffect(() => {
    const init = async () => {
      if (accountAddress) {
        // fetch calldata to be submitted for calling L2 function
        const [data, params] = await l1PublicClient.readContract({
          address: l1MigratorAddress,
          abi: l1Migrator,
          functionName: "getMigrateDelegatorParams",
          args: [
            state.signer ? state.signer : accountAddress,
            state.signer ? state.signer : accountAddress,
          ],
        });

        dispatch({
          type: "initialize",
          payload: {
            isOrchestrator: l1Delegator?.transcoderStatus === "registered",
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
  }, [state.signer, accountAddress]);

  useEffect(() => {
    const init = async () => {
      if (isAddress(signerAddress)) {
        if (!state.isOrchestrator) {
          dispatch({
            type: "updateSigner",
            payload: {
              signer: getAddress(signerAddress),
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
  }, [signerAddress, activeChain, state.isOrchestrator]);

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
                css={{ marginTop: "$4" }}
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
          !!signature && !!signer && getAddress(signer) === getAddress(state.migrationParams.delegate);

        return (
          <Box>
            <Text css={{ marginBottom: "$3" }}>
              Run the Livepeer CLI and select the option to &quot;Sign typed
              data&quot;. When prompted for the typed data message to sign, copy
              and paste the following message.
            </Text>

            <CodeBlock
              key={Math.random()}
              css={{ mb: "$4" }}
              showLineNumbers={false}
              id="message"
              isHighlightingLines={false}
            >
              {JSON.stringify(payload)}
            </CodeBlock>

            <Text css={{ marginBottom: "$2" }}>
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
              <Text size="1" css={{ marginTop: "$1", marginBottom: "$1" }}>
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
                css={{ marginTop: "$4", marginRight: "$2" }}
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
            <Text css={{ marginBottom: "$3" }}>
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
                css={{ marginRight: "$2" }}
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
        marginTop: "$8",
        width: "100%",
        "@bp3": {
          width: 650,
        },
      }}
    >
      <Card
        css={{
          paddingTop: "$5",
          borderRadius: "$4",
          backgroundColor: "$panel",
          border: "1px solid $neutral5",
          marginBottom: "$8",
        }}
      >
        <Box css={{ paddingLeft: "$5", paddingRight: "$5" }}>
          <Box
            css={{
              marginLeft: "auto",
              marginRight: "auto",
              textAlign: "center",
            }}
          >
            <Heading size="2" css={{ marginBottom: "$2", fontWeight: 600 }}>
              {state.title}
            </Heading>
            {state?.body && <Box>{state.body}</Box>}

            {state.image && (
              <Box css={{ textAlign: "center", marginBottom: "$5" }}>
                <Box as="img" src={state.image} />
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
            <Flex css={{ justifyContent: "center", marginBottom: "$7" }}>
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
            <Box css={{ marginBottom: "$4" }}>
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
              css={{ marginRight: "$2", width: "100%" }}
              onClick={onApprove}
            >
              Approve Migration
            </Button>
          )}
          {state.footnote && (
            <Text
              size="1"
              variant="neutral"
              css={{ marginTop: "$3", textAlign: "center" }}
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
            paddingLeft: "$4",
            paddingRight: "$4",
            paddingTop: "$3",
            paddingBottom: "$3",
            borderTop: "1px dashed $neutral4",
            textAlign: "center",
            marginTop: "$5",
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
            <Box css={{ marginLeft: "$1" }} as={ArrowTopRightIcon} />
          </Button>
          <Button
            css={{ bottom: 20, right: 20 }}
            as="a"
            href="https://discord.gg/livepeer"
            target="_blank"
            size="3"
            ghost
          >
            Discord Support Channel{" "}
            <Box css={{ marginLeft: "$1" }} as={ArrowTopRightIcon} />
          </Button>
        </Flex>
      </Card>
    </Container>
  );
};

const ReadOnlyCard = styled(Box, {
  length: {},
  display: "flex",
  backgroundColor: "$neutral3",
  border: "1px solid $neutral6",
  borderRadius: "$3",
  justifyContent: "space-between",
  alignItems: "center",
  p: "$3",
});

function MigrationFields({ migrationParams, css = {} }) {
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

MigrateOrchestrator.getLayout = getLayout;

export default MigrateOrchestrator;

function ReceiptLink({ label, hash, chainId }) {
  return (
    <Box
      css={{
        justifyContent: "center",
        display: "flex",
        alignItems: "center",
      }}
    >
      <Text variant="neutral">{label}:</Text>
      <A
        css={{ marginLeft: "$2", display: "flex", alignItems: "center" }}
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
