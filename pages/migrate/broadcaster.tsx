import Spinner from "@components/Spinner";
import { getLayout } from "@layouts/main";
import {
  Box,
  Button,
  Card,
  Container,
  Flex,
  Heading,
  Link as LivepeerLink,
  styled,
  Text,
  TextField,
  useSnackbar
} from "@jjasonn.stone/design-system";
import { useEffect, useReducer, useState } from "react";

import { CodeBlock } from "@components/CodeBlock";
import { inbox } from "@lib/api/abis/bridge/Inbox";
import { l1Migrator } from "@lib/api/abis/bridge/L1Migrator";
import {
  getInboxAddress,
  getL1MigratorAddress,
  getNodeInterfaceAddress
} from "@lib/api/contracts";
import { isL2ChainId, l1PublicClient } from "@lib/chains";
import { Step, StepContent, StepLabel, Stepper } from "@mui/material";
import { ArrowTopRightIcon } from "@modulz/radix-icons";
import { ethers, TypedDataEncoder, verifyTypedData } from "ethers";
import { useAccountAddress, useActiveChain } from "hooks";
import {
  CHAIN_INFO,
  DEFAULT_CHAIN_ID, L1_CHAIN_ID,
  l2Provider
} from "lib/chains";
import { useRouter } from "next/router";
import useForm from "react-hook-form";
import { useTimer } from "react-timer-hook";
import { isValidAddress } from "utils/validAddress";
import { stepperStyles } from "../../utils/stepperStyles";

const signingSteps = [
  `This account has no deposit or reserve on ${CHAIN_INFO[L1_CHAIN_ID].label}. If you wish to migrate the
  deposit and reserve of another account via the Livepeer CLI enter its address below.`,
  "Sign message",
  "Approve migration",
];

const initialState = {
  title: `Migrate Broadcaster to ${CHAIN_INFO[DEFAULT_CHAIN_ID].label}`,
  stage: "connectWallet",
  body: (
    <Text variant="neutral" css={{ mb: "$5" }}>
      This tool will safely migrate your broadcaster&apos;s deposit and reserve
      to {CHAIN_INFO[DEFAULT_CHAIN_ID].label}.
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
        Migrate Broadcaster
      </Button>
      <Text size="2" css={{ mt: "$2", fontWeight: 600, color: "$red11" }}>
        Connect your wallet to continue.
      </Text>
    </Flex>
  ),
  image: "/img/arbitrum.svg",
  loading: false,
};

function reducer(state, action) {
  switch (action.type) {
    case "accountChanged":
      return {
        ...state,
        ...action.payload,
      };
    case "initialize":
      return {
        ...state,
        stage: "initialize",
        title: `Migrate Broadcaster to ${CHAIN_INFO[DEFAULT_CHAIN_ID].label}`,
        image: false,
        loading: false,
        receipts: null,
        body: (
          <Text variant="neutral" css={{ mb: "$5" }}>
            This tool will safely migrate your broadcaster&apos;s deposit and
            reserve to {CHAIN_INFO[DEFAULT_CHAIN_ID].label}.
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
            Your broadcaster&apos;s deposit and reserve have been migrated to{" "}
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
        title: `Migrate Broadcaster to ${CHAIN_INFO[DEFAULT_CHAIN_ID].label}`,
        image: false,
        loading: false,
        receipts: null,
        body: (
          <Text variant="neutral" css={{ mb: "$5" }}>
            This tool will safely migrate your broadcaster&apos;s deposit and
            reserve to {CHAIN_INFO[DEFAULT_CHAIN_ID].label}.
          </Text>
        ),
        ...action.payload,
      };
    default:
      return state;
  }
}

const inboxAddress = getInboxAddress();
const l1MigratorAddress = getL1MigratorAddress();
const nodeInterfaceAddress = getNodeInterfaceAddress();

const MigrateBroadcaster = () => {
  const router = useRouter();
  const [state, dispatch] = useReducer(reducer, initialState);

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
  interface FormInputs {
  signerAddress: string;
  signature: string;
}

const { register, watch } = useForm<FormInputs>();
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

      // Get the current block to use its base fee
      const block = await l2Provider.getBlock('latest');
      if (!block?.baseFeePerGas) throw new Error("Failed to get base fee");

      // fetching submission price using block's base fee
      // https://docs.arbitrum.io/how-arbitrum-works/gas-fees
      const submissionPrice = await l1PublicClient.readContract({
        address: inboxAddress,
        abi: inbox,
        functionName: "calculateRetryableSubmissionFee",
        args: [
          state.migrationCallData.length,
          block.baseFeePerGas,  // Use block's base fee as per Nitro upgrade
        ],
      });

      // Overpay submission price by 50% to account for potential increases
      // https://docs.arbitrum.io/how-arbitrum-works/gas-fees#important-note-about-base-submission-fee
      // Any excess will be credited back to the credit-back address

      // calculating estimated gas for the tx
      // const estimatedGas = await l2PublicClient.estimateContractGas({
      //   address: nodeInterfaceAddress,
      //   abi: nodeInterface,
      //   functionName: "estimateRetryableTicket",
      //   args: [
      //     CHAIN_INFO[DEFAULT_CHAIN_ID].contracts.l1Migrator,
      //     ethers.utils.parseEther("0.01").toBigInt(),
      //     CHAIN_INFO[DEFAULT_CHAIN_ID].contracts.l2Migrator,
      //     0n,
      //     accountAddress,
      //     accountAddress,
      //     state.migrationCallData,
      //   ],
      // });

      // overpaying gas just in case
      // the excess will be sent back to the refund address
      // const maxGas = BigNumber.from(estimatedGas).mul(4);

      // ethValue will be sent as callvalue
      // this entire amount will be used for successfully completing
      // the L2 side of the transaction
      // maxSubmissionPrice + totalGasPrice (estimatedGas * gasPriceBid)
      // const ethValue = await maxSubmissionPrice.add(gasPriceBid.mul(maxGas));

      // const tx1 = await l1Migrator.migrateDelegator(
      //   accountAddress,
      //   accountAddress,
      //   signature ? signature : "0x",
      //   maxGas,
      //   gasPriceBid,
      //   maxSubmissionPrice,
      //   {
      //     value: ethValue,
      //   }
      // );
      // dispatch({
      //   type: "starting",
      //   payload: {
      //     receipts: {
      //       l1: tx1.hash,
      //     },
      //   },
      // });

      // await tx1.wait();

      // // start timer
      // start();

      // dispatch({
      //   type: "enRoute",
      //   payload: {
      //     body: (
      //       <Box css={{ mb: "$4" }}>
      //         <Text variant="neutral" css={{ display: "block", mb: "$4" }}>
      //           Estimated time remaining: {minutes}:
      //           {seconds.toString().padStart(2, "0")}
      //         </Text>
      //       </Box>
      //     ),
      //   },
      // });

      // const tx2 = await waitToRelayTxsToL2(
      //   waitForTx(tx1),
      //   CHAIN_INFO[DEFAULT_CHAIN_ID].contracts.inbox,
      //   l1Provider,
      //   l2Provider
      // );

      // dispatch({
      //   type: "complete",
      //   payload: {
      //     receipts: {
      //       l1: tx1.hash,
      //       l2: tx2.transactionHash,
      //     },
      //     cta: (
      //       <Box css={{ textAlign: "center" }}>
      //         <Link
      //           href={`/accounts/${
      //             state.signer ? state.signer : accountAddress
      //           }/delegating`}
      //           passHref
      //         >
      //           <Button
      //             as="LivepeerLink"
      //             variant="primary"
      //             size="4"
      //             css={{
      //               display: "inline-flex",
      //               ai: "center",
      //               mt: "$2",
      //               mb: "$2",
      //             }}
      //           >
      //             View account on {CHAIN_INFO[DEFAULT_CHAIN_ID].label}
      //             <Box as={ArrowRightIcon} css={{ ml: "$2" }} />
      //           </Button>
      //         </Link>
      //       </Box>
      //     ),
      //     loading: false,
      //     footnote: null,
      //   },
      // });
    } catch (e) {
      console.log(e);
      openSnackbar((e as Error)?.message);
      handleReset();
    }
  };

  useEffect(() => {
    const init = async () => {
      if (accountAddress) {
        const [_unused, params] = (await l1PublicClient.readContract({
          address: l1MigratorAddress,
          abi: l1Migrator,
          functionName: "getMigrateSenderParams",
          args: [accountAddress, accountAddress],
        })) as [string, {
          l1Addr: string;
          l2Addr: string;
          deposit: number;
          reserve: number;
        }];

        const showSigningSteps =
          params.deposit.toString() == "0" && params.reserve.toString() == "0";
        dispatch({
          type: "accountChanged",
          payload: {
            showSigningSteps,
          },
        });
      }
    };
    init();
  }, [accountAddress]);

  useEffect(() => {
    const init = async () => {
      if (accountAddress) {
        // fetch calldata to be submitted for calling L2 function
        interface MigrationParams {
          l1Addr: string;
          l2Addr: string;
          deposit: number;
          reserve: number;
        }

        const [data, params] = (await l1PublicClient.readContract({
          address: l1MigratorAddress,
          abi: l1Migrator,
          functionName: "getMigrateSenderParams",
          args: [ state.signer ? state.signer : accountAddress,
            state.signer ? state.signer : accountAddress],
        })) as [string, MigrationParams];

        dispatch({
          type: "initialize",
          payload: {
            migrationCallData: data,
            migrationParams: {
              l1Addr: params.l1Addr,
              l2Addr: params.l2Addr,
              deposit: params.deposit,
              reserve: params.reserve,
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
      if (isValidAddress(signerAddress) && state.showSigningSteps) {
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
    };
    init();
  }, [signerAddress, activeChain, state.showSigningSteps]);

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
          MigrateSender: [
            { name: "l1Addr", type: "address" },
            { name: "l2Addr", type: "address" },
          ],
        };
        const value = {
          l1Addr: state.signer,
          l2Addr: state.signer,
        };

        const payload = TypedDataEncoder.getPayload(domain, types, value);
        let signer = "";

        if (signature) {
          try {
            signer = verifyTypedData(domain, types, value, signature);
          } catch (e) {
            console.log(e);
          }
        }

        const validSignature =
          isValidAddress(signer) ===
          isValidAddress(state.migrationParams.l1Addr);

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
                  : `Invalid. Message must be signed by ${state.migrationParams.l1Addr}`}
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
              Approve migration on behalf of your account.
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
                <Box as="img" src={state.image} />
              </Box>
            )}

            {state.stage === "initialize" && !state.showSigningSteps && (
              <MigrationFields
                migrationParams={state.migrationParams}
                css={{ mb: "$5" }}
              />
            )}

            <Box
              css={{
                display:
                  state.stage === "initialize" && state.showSigningSteps
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
          {state.stage === "initialize" && !state.showSigningSteps && (
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
    length: {},
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
          {migrationParams.l1Addr.replace(
            migrationParams.l1Addr.slice(6, 38),
            "…"
          )}
        </Box>
      </ReadOnlyCard>
      <ReadOnlyCard css={{ mb: "$2" }}>
        <Box css={{ fontWeight: 500, color: "$neutral10" }}>Deposit</Box>
        <Box>{ethers.formatEther(migrationParams.deposit)} ETH</Box>
      </ReadOnlyCard>
      <ReadOnlyCard css={{ mb: "$2" }}>
        <Box css={{ fontWeight: 500, color: "$neutral10" }}>Reserve</Box>
        <Box>{ethers.formatEther(migrationParams.reserve)} ETH</Box>
      </ReadOnlyCard>
    </Box>
  );
}

MigrateBroadcaster.getLayout = getLayout;

export default MigrateBroadcaster;

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
      <LivepeerLink
        css={{ ml: "$2", display: "flex", ai: "center" }}
        variant="primary"
        target="_blank"
        rel="noopener noreferrer"
        href={`${CHAIN_INFO[chainId].explorer}tx/${hash}`}
      >
        {hash.replace(hash.slice(6, 62), "…")}
        <Box as={ArrowTopRightIcon} />
      </LivepeerLink>
    </Box>
  );
}
