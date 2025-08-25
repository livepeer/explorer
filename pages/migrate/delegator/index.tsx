import Spinner from "@components/Spinner";
import { getLayout } from "@layouts/main";
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
  useSnackbar
} from "@livepeer/design-system";
import { useEffect, useReducer, useState, useMemo, useCallback } from "react";

import { CodeBlock } from "@components/CodeBlock";
import { isL2ChainId } from "@lib/chains";
import { Step, StepContent, StepLabel, Stepper } from "@material-ui/core";
import { ArrowTopRightIcon } from "@modulz/radix-icons";
import { ethers } from "ethers";
import {
  useAccountAddress,
  useActiveChain,

  useL1DelegatorData
} from "hooks";
import {
  CHAIN_INFO,
  DEFAULT_CHAIN_ID, L1_CHAIN_ID
} from "lib/chains";
import { useRouter } from "next/router";
import useForm from "react-hook-form";
import { useTimer } from "react-timer-hook";
import { isValidAddress } from "utils/validAddress";
import { stepperStyles } from "../../../utils/stepperStyles";

const signingSteps = [
  {
    id: "intro",
    label: `This account has no undelegated stake on ${CHAIN_INFO[L1_CHAIN_ID].label}. If you wish to migrate the undelegated stake of another account via the Livepeer CLI enter its address below.`,
  },
  { id: "sign", label: "Sign message" },
  { id: "approve", label: "Approve migration" },
] as const;

const initialState = {
  title: `Migrate Undelegated Stake to ${CHAIN_INFO[DEFAULT_CHAIN_ID].label}`,
  stage: "connectWallet",
  body: (
    <Text variant="neutral" css={{ marginBottom: "$5" }}>
      This tool will safely migrate your undelegated stake to{" "}
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
        Migrate Undelegated Stake
      </Button>
      <Text size="2" css={{ marginTop: "$2", fontWeight: 600, color: "$red11" }}>
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
        title: `Migrate Undelegated Stake to ${CHAIN_INFO[DEFAULT_CHAIN_ID].label}`,
        image: false,
        loading: false,
        receipts: null,
        body: (
          <Text variant="neutral" css={{ marginBottom: "$5" }}>
            This tool will safely migrate your undelegated stake to{" "}
            {CHAIN_INFO[DEFAULT_CHAIN_ID].label}.
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
          <Text variant="neutral" css={{ display: "block", marginBottom: "$4" }}>
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
            <Text css={{ display: "block", color: "$neutral11", marginBottom: "$4" }}>
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
          <Text variant="neutral" css={{ display: "block", marginBottom: "$4" }}>
            Your undelegated stake has been migrated to{" "}
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
        title: `Migrate Undelegated Stake to ${CHAIN_INFO[DEFAULT_CHAIN_ID].label}`,
        image: false,
        loading: false,
        receipts: null,
        body: (
          <Text variant="neutral" css={{ marginBottom: "$5" }}>
            This tool will safely migrate your undelegated stake to{" "}
            {CHAIN_INFO[DEFAULT_CHAIN_ID].label}.
          </Text>
        ),
        ...action.payload,
      };
    default:
      return state;
  }
}

const MigrateUndelegatedStake = () => {
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
  const { register, watch } = useForm();
  const signature = watch("signature");
  const signerAddress = watch("signerAddress");

  /** Returns a Date object set to 10 minutes from now. */
  const createExpiryTimestamp = useCallback(() => {
    const time = new Date();
    time.setSeconds(time.getSeconds() + 600);  // 10 minutes timer
    return time;
  }, []);

  // Memoize initial expiry to avoid subtle hydration timing diffs.  
  const expiryTimestamp = useMemo(() => createExpiryTimestamp(), [createExpiryTimestamp]);

  const l1Delegator = useL1DelegatorData(accountAddress);
  // NOTE: Relevant code is commented out—uncomment to re-enable if needed.
  // const l1SignerOrAddress = useL1DelegatorData(
  //   state.signer ? state.signer : accountAddress
  // );
  
  const { seconds, minutes, start, restart } = useTimer({
    autoStart: false,
    expiryTimestamp,
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
              <Text variant="neutral" css={{ display: "block", marginBottom: "$4" }}>
                Estimated time remaining: {minutes}:
                {seconds.toString().padStart(2, "0")}
              </Text>
            </Box>
          ),
        },
      });
    }
  }, [state.stage, minutes, seconds]);

  // const onApprove = async () => {
  //   try {
  //     dispatch({
  //       type: "initiate",
  //     });

  //     const gasPriceBid = await l2Provider.getGasPrice();

  //     // fetching submission price
  //     // https://developer.offchainlabs.com/docs/l1_l2_messages#parameters
  //     const submissionPrice = await inbox.calculateRetryableSubmissionFee(
  //       state.migrationCallData.length,
  //       gasPriceBid // TODO change this to 0 to use the block.basefee once Nitro upgrades
  //     );

  //     // overpaying submission price to account for increase
  //     // https://developer.offchainlabs.com/docs/l1_l2_messages#important-note-about-base-submission-fee
  //     // the excess will be sent back to the refund address
  //     const maxSubmissionPrice = submissionPrice.mul(4);

  //     // calculating estimated gas for the tx
  //     const estimatedGas =
  //       await nodeInterface.estimateGas.estimateRetryableTicket(
  //         CHAIN_INFO[DEFAULT_CHAIN_ID].contracts.l1Migrator,
  //         ethers.utils.parseEther("0.01"),
  //         CHAIN_INFO[DEFAULT_CHAIN_ID].contracts.l2Migrator,
  //         0,
  //         accountAddress,
  //         accountAddress,
  //         state.migrationCallData
  //       );

  //     // overpaying gas just in case
  //     // the excess will be sent back to the refund address
  //     const maxGas = estimatedGas.mul(4);

  //     // ethValue will be sent as callvalue
  //     // this entire amount will be used for successfully completing
  //     // the L2 side of the transaction
  //     // maxSubmissionPrice + totalGasPrice (estimatedGas * gasPrice)
  //     const ethValue = await maxSubmissionPrice.add(gasPriceBid.mul(maxGas));

  //     const tx1 = await l1Migrator.migrateUnbondingLocks(
  //       state.signer ? state.signer : accountAddress,
  //       state.signer ? state.signer : accountAddress,
  //       state.migrationParams.unbondingLockIds,
  //       signature ? signature : "0x",
  //       maxGas,
  //       gasPriceBid,
  //       maxSubmissionPrice,
  //       {
  //         value: ethValue,
  //       }
  //     );
  //     dispatch({
  //       type: "starting",
  //       payload: {
  //         receipts: {
  //           l1: tx1.hash,
  //         },
  //       },
  //     });

  //     await tx1.wait();

  //     // start timer
  //     start();

  //     dispatch({
  //       type: "enRoute",
  //       payload: {
  //         body: (
  //           <Box css={{ marginBottom: "$4" }}>
  //             <Text variant="neutral" css={{ display: "block", marginBottom: "$4" }}>
  //               Estimated time remaining: {minutes}:
  //               {seconds.toString().padStart(2, "0")}
  //             </Text>
  //           </Box>
  //         ),
  //       },
  //     });

  //     const tx2 = await waitToRelayTxsToL2(
  //       waitForTx(tx1),
  //       CHAIN_INFO[DEFAULT_CHAIN_ID].contracts.inbox,
  //       l1Provider,
  //       l2Provider
  //     );

  //     dispatch({
  //       type: "complete",
  //       payload: {
  //         receipts: {
  //           l1: tx1.hash,
  //           l2: tx2.transactionHash,
  //         },
  //         cta: (
  //           <Box css={{ textAlign: "center" }}>
  //             <Link
  //               href={`/accounts/${
  //                 state.signer ? state.signer : accountAddress
  //               }/delegating`}
  //               passHref
  //             >
  //               <Button
  //                 as="A"
  //                 variant="primary"
  //                 size="4"
  //                 css={{
  //                   display: "inline-flex",
  //                   ai: "center",
  //                   marginTop: "$2",
  //                   marginBottom: "$2",
  //                 }}
  //               >
  //                 View account on {CHAIN_INFO[DEFAULT_CHAIN_ID].label}
  //                 <Box as={ArrowRightIcon} css={{ marginLeft: "$2" }} />
  //               </Button>
  //             </Link>
  //           </Box>
  //         ),
  //         loading: false,
  //         footnote: null,
  //       },
  //     });
  //   } catch (e) {
  //     console.log(e);
  //     openSnackbar(e.message);
  //     handleReset();
  //   }
  // };

  useEffect(() => {
    const init = async () => {
      if (accountAddress && l1Delegator) {
        const locks = l1Delegator.activeLocks.map((e) => e.id);
        dispatch({
          type: "accountChanged",
          payload: {
            showSigningSteps: !locks.length,
          },
        });
      }
    };
    init();
  }, [accountAddress, l1Delegator]);

  // useEffect(() => {
  //   const init = async () => {
  //     if (accountAddress && l1SignerOrAddress) {
  //       const locks = l1SignerOrAddress.activeLocks.map((e) => e.id);

  //       // fetch calldata to be submitted for calling L2 function
  //       const { data, params } =
  //         await l1Migrator.getMigrateUnbondingLocksParams(
  //           state.signer ? state.signer : accountAddress,
  //           state.signer ? state.signer : accountAddress,
  //           locks
  //         );
  //       dispatch({
  //         type: "initialize",
  //         payload: {
  //           migrationCallData: data,
  //           migrationParams: {
  //             l1Addr: params.l1Addr,
  //             l2Addr: params.l2Addr,
  //             total: params.total,
  //             unbondingLockIds: params.unbondingLockIds,
  //           },
  //         },
  //       });
  //     }
  //   };
  //   init();
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [state.signer, accountAddress, l1SignerOrAddress]);

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

  // NOTE: Relevant code is commented out—uncomment to re-enable if needed.
  // const handleReset = () => {
  //   restart(createExpiryTimestamp(), false); // restart timer
  //   dispatch({ type: "reset" });
  // };

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
                css={{ marginTop: "$3", marginBottom: "$2" }}
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
          MigrateUnbondingLocks: [
            { name: "l1Addr", type: "address" },
            { name: "l2Addr", type: "address" },
            { name: "unbondingLockIds", type: "uint256[]" },
          ],
        };
        const value = {
          l1Addr: state.signer,
          l2Addr: state.signer,
          unbondingLockIds: state.migrationParams.unbondingLockIds,
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
          isValidAddress(state.migrationParams.l1Addr);

        return (
          <Box>
            <Text css={{ marginBottom: "$3" }}>
              Run the Livepeer CLI and select the option to &quot;Sign typed
              data&quot;. When prompted for the typed data message to sign, copy
              and paste the following message.
            </Text>

            <CodeBlock
              css={{ marginBottom: "$4" }}
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
                  : `Invalid. Message must be signed by ${state.migrationParams.l1Addr}`}
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
              Approve migration on behalf of your account.
            </Text>
            {state.migrationParams && (
              <MigrationFields
                migrationParams={state.migrationParams}
                css={{ marginBottom: "$5" }}
              />
            )}
            <Box>
              <Button
                size="4"
                variant="primary"
                css={{ marginRight: "$2" }}
                disabled
                // onClick={onApprove}
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
          <Box css={{ marginLeft: "auto", marginRight: "auto", textAlign: "center" }}>
            <Heading size="2" css={{ marginBottom: "$2", fontWeight: 600 }}>
              {state.title}
            </Heading>
            {state?.body && <Box>{state.body}</Box>}

            {state.image && (
              <Box css={{ textAlign: "center", marginBottom: "$5" }}>
                <Box as="img" src={state.image} />
              </Box>
            )}

            {state.stage === "initialize" && !state.showSigningSteps && (
              <MigrationFields
                migrationParams={state.migrationParams}
                css={{ marginBottom: "$5" }}
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
                  {signingSteps.map((step, index, arr) => {
                    const isLast = index === arr.length - 1;
                    return (
                      <Step key={step.id}>
                        <Box
                          as={StepLabel}
                          optional={
                            isLast ? (
                              <Text variant="neutral" size="1">
                                Last step
                              </Text>
                            ) : null
                          }
                        >
                          {step.label}
                        </Box>
                        <StepContent TransitionProps={{ unmountOnExit: false }}>
                          {getSigningStepContent(index)}
                        </StepContent>
                      </Step>
                    );
                  })}
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
          {state.stage === "initialize" && !state.showSigningSteps && (
            <Button
              size="4"
              variant="primary"
              css={{ marginRight: "$2", width: "100%" }}
              // onClick={onApprove}
              disabled
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
      <ReadOnlyCard css={{ marginBottom: "$2" }}>
        <Box css={{ fontWeight: 500, color: "$neutral10" }}>Address</Box>
        <Box>
          {migrationParams.l1Addr.replace(
            migrationParams.l1Addr.slice(6, 38),
            "…"
          )}
        </Box>
      </ReadOnlyCard>
      <ReadOnlyCard>
        <Box css={{ fontWeight: 500, color: "$neutral10" }}>
          Total Undelegated
        </Box>
        <Box>{ethers.utils.formatEther(migrationParams.total)} LPT</Box>
      </ReadOnlyCard>
    </Box>
  );
}

MigrateUndelegatedStake.getLayout = getLayout;

export default MigrateUndelegatedStake;

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
