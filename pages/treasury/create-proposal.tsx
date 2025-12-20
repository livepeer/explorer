import MarkdownRenderer from "@components/MarkdownRenderer";
import Spinner from "@components/Spinner";
import { livepeerGovernor } from "@lib/api/abis/main/LivepeerGovernor";
import { livepeerToken } from "@lib/api/abis/main/LivepeerToken";
import { getLivepeerTokenAddress } from "@lib/api/contracts";
import { abbreviateNumber, fromWei, toWei } from "@lib/utils";
import {
  Box,
  Button,
  Card,
  Container,
  Flex,
  Heading,
  styled,
  Text,
  TextArea,
  TextField,
} from "@livepeer/design-system";
import { Tab, TabList, TabPanel, TabPanels, Tabs } from "@reach/tabs";
import {
  useAccountAddress,
  useAccountBalanceData,
  useContractInfoData,
  useTreasuryVotingPowerData,
} from "hooks";
import { useHandleTransaction } from "hooks/useHandleTransaction";
import { LAYOUT_MAX_WIDTH } from "layouts/constants";
import { getLayout } from "layouts/main";
import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import { Address, encodeFunctionData, isAddress } from "viem";
import { useSimulateContract, useWriteContract } from "wagmi";

const StyledTab = styled(Tab, {
  position: "relative",
  cursor: "pointer",
  color: "$neutral10",
  paddingTop: "$1",
  paddingBottom: "$1",
  paddingLeft: "$2",
  paddingRight: "$2",
  fontWeight: 600,
  fontFamily: "$monospace",
  border: "2px solid $neutral7",
  backgroundColor: "$panel",
  marginBottom: "-1px",
  "&:first-child": {
    borderTopLeftRadius: "$4",
    marginRight: "-2px",
  },
  "&:last-child": {
    borderTopRightRadius: "$4",
    maringLeft: "-2px",
  },
  "&[data-selected]": {
    zIndex: 1,
    backgroundColor: "$panel",
    color: "$primary11",
    border: "2px solid $primary11",
  },
});

type Mutable<T> = {
  -readonly [K in keyof T]: Mutable<T[K]>;
};

const formatLPT = (lpt: string) => abbreviateNumber(lpt, 6);

const CreateProposal = () => {
  const accountAddress = useAccountAddress();
  const contractAddresses = useContractInfoData();
  const treasuryAccountBalanceData = useAccountBalanceData(
    contractAddresses.Treasury?.address
  );
  const treasuryBalance = useMemo(
    () =>
      treasuryAccountBalanceData &&
      fromWei(treasuryAccountBalanceData?.balance),
    [treasuryAccountBalanceData]
  );

  const votingPower = useTreasuryVotingPowerData(accountAddress);

  const [livepeerTokenAddress, setLivepeerTokenAddress] = useState<Address>();
  useEffect(() => {
    getLivepeerTokenAddress().then((address) => {
      setLivepeerTokenAddress(address);
    });
  }, []);

  const sufficientStake = useMemo(() => {
    if (!votingPower) {
      return null;
    }

    const votes = BigInt(votingPower.self.votes);
    const threshold = BigInt(votingPower.proposalThreshold);

    return votes >= threshold;
  }, [votingPower]);

  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [lptReceiver, setLptReceiver] = useState("");
  const [lptAmount, setLptAmount] = useState(0);

  const description = useMemo(() => {
    if (!formTitle || !formDescription) {
      return null;
    }
    // merge title and description as markdown
    return `# ${formTitle}\n${formDescription}`;
  }, [formTitle, formDescription]);

  const transferTokenFunctionData = useMemo(() => {
    if (!isAddress(lptReceiver) || !lptAmount) {
      return null;
    }
    return encodeFunctionData({
      abi: livepeerToken as Mutable<typeof livepeerToken>,
      functionName: "transfer",
      args: [lptReceiver, toWei(lptAmount)],
    });
  }, [lptReceiver, lptAmount]);

  const txEnabled = Boolean(
    contractAddresses.LivepeerGovernor?.address &&
      livepeerTokenAddress &&
      transferTokenFunctionData &&
      description
  );
  const { data: config } = useSimulateContract({
    query: { enabled: txEnabled },
    address: contractAddresses.LivepeerGovernor?.address,
    abi: livepeerGovernor,
    functionName: "propose",
    args: [
      [livepeerTokenAddress!],
      [0n],
      [transferTokenFunctionData!],
      description!,
    ],
  });
  const {
    data: proposeResult,
    status,
    isPending,
    writeContract,
    error,
    isSuccess,
  } = useWriteContract();

  useHandleTransaction("propose", proposeResult, error, isPending, isSuccess, {
    proposal: description,
  });

  return (
    <>
      <Head>
        <title>Livepeer Explorer - Treasury</title>
      </Head>
      <Container
        css={{
          maxWidth: LAYOUT_MAX_WIDTH,
          width: "100%",
          "@bp3": {
            width: "61.8%",
          },
        }}
      >
        <Flex
          css={{
            marginTop: "$6",
            marginBottom: "$4",
            alignItems: "flex-start",
            justifyContent: "space-between",
            flexDirection: "column",
            gap: "$2",
            "@bp3": {
              alignItems: "flex-end",
              flexDirection: "row",
            },
          }}
        >
          <Heading size="2" as="h1" css={{ fontWeight: 700 }}>
            Create Proposal
          </Heading>

          {treasuryBalance && (
            <Text variant="neutral" size="3">
              Treasury Balance: {formatLPT(treasuryBalance)} LPT
            </Text>
          )}
        </Flex>
        <Box
          as="form"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              if (!config) {
                throw new Error("No config for proposal");
              }
              console.log("submitting!");
              writeContract(config.request);
            } catch (err: unknown) {
              console.error(err);
              return {
                error: err instanceof Error ? err.message : String(err),
              };
            }
          }}
        >
          <TextField
            name="title"
            placeholder="Title"
            size="3"
            value={formTitle}
            onChange={(e) => {
              setFormTitle(e.target.value);
            }}
            css={{
              marginBottom: "$5",
            }}
          />

          <Tabs>
            <TabList>
              <StyledTab>Write</StyledTab>
              <StyledTab>Preview</StyledTab>
            </TabList>
            <TabPanels>
              <TabPanel>
                <TextArea
                  name="description"
                  value={formDescription}
                  onChange={(e) => {
                    setFormDescription(e.target.value);
                  }}
                  css={{
                    height: 240,
                    borderTopLeftRadius: "0",
                    "@bp3": {
                      height: 360,
                    },
                  }}
                  placeholder="Describe your proposal (markdown)"
                  size="3"
                />
              </TabPanel>
              <TabPanel style={{ paddingBottom: "3.32px" }}>
                <Card
                  css={{
                    minHeight: 240,
                    boxShadow: "inset 0 0 0 1px $colors$neutral7",
                    borderRadius: "$2",
                    borderTopLeftRadius: "0",
                    backgroundColor: "$panel",
                    "@bp3": {
                      minHeight: 360,
                    },

                    // Apply same card styling as proposal page.
                    padding: "$4",
                    // border: "1px solid $neutral4",
                    // mb: "$3",
                  }}
                >
                  <MarkdownRenderer>
                    {`# ${formTitle}\n${formDescription}`}
                  </MarkdownRenderer>
                </Card>
              </TabPanel>
            </TabPanels>
          </Tabs>
          <Flex
            css={{
              marginTop: "$5",
              alignItems: "stretch",
              justifyContent: "flex-start",
              flexDirection: "column",
              gap: "$4",
              "@bp3": {
                alignItems: "center",
                flexDirection: "row",
                gap: "$5",
                justifyContent: "flex-start",
              },
            }}
          >
            <Flex
              css={{
                flexDirection: "column",
                gap: "$2",
                width: "100%",
                "@bp3": {
                  flexDirection: "row",
                  alignItems: "center",
                  width: "auto",
                  minWidth: 0,
                  flex: "1 1 420px",
                },
              }}
            >
              <Text variant="neutral" size="3">
                LPT receiver:
              </Text>
              <TextField
                css={{
                  width: "100%",
                  "@bp3": {
                    marginLeft: "$2",
                    marginRight: "$3",
                    width: "auto",
                    minWidth: 378,
                    flex: "1 1 420px",
                  },
                }}
                name="lpt-receiver"
                placeholder="Ethereum Address (0x...)"
                size="3"
                value={lptReceiver}
                onChange={(e) => {
                  setLptReceiver(e.target.value);
                }}
              />
            </Flex>
            <Flex
              css={{
                flexDirection: "column",
                gap: "$2",
                width: "100%",
                "@bp3": {
                  flexDirection: "row",
                  alignItems: "center",
                  width: "auto",
                  minWidth: 0,
                  flex: "1 1 200px",
                },
              }}
            >
              <Text variant="neutral" size="3">
                Amount:
              </Text>
              <Flex
                css={{
                  alignItems: "center",
                  gap: "$2",
                  width: "100%",
                  "@bp3": {
                    width: "auto",
                    minWidth: 0,
                    flex: "1 1 200px",
                  },
                }}
              >
                <TextField
                  css={{
                    width: "100%",
                    "@bp3": {
                      marginLeft: "$2",
                      marginRight: "$1",
                      width: "auto",
                      minWidth: 100,
                      flex: "1 1 200px",
                    },
                  }}
                  name="lpt-amount"
                  placeholder="Amount in LPT"
                  type="number"
                  size="3"
                  min="1"
                  max={treasuryBalance ?? 1}
                  value={lptAmount}
                  onChange={(e) => {
                    setLptAmount(parseFloat(e.target.value));
                  }}
                />
                <Text
                  variant="neutral"
                  size="3"
                  css={{
                    fontWeight: 600,
                    textTransform: "uppercase",
                  }}
                >
                  LPT
                </Text>
              </Flex>
            </Flex>
          </Flex>

          <Flex
            css={{
              marginTop: "$5",
              alignItems: "stretch",
              justifyContent: "flex-end",
              flexDirection: "column",
              gap: "$3",
              paddingBottom: "$4",
              "@bp3": {
                alignItems: "center",
                flexDirection: "row",
                paddingBottom: 0,
              },
            }}
          >
            {!accountAddress ? (
              <Box css={{ color: "$red11", fontSize: "$1" }}>
                Connect your wallet to create a proposal.
              </Box>
            ) : !votingPower ? (
              <>
                <Box css={{ marginRight: "$3" }}>
                  Loading Staked LPT Balance
                </Box>
                <Spinner />
              </>
            ) : (
              <>
                {!sufficientStake ? (
                  <Box css={{ color: "$red11", fontSize: "$1" }}>
                    Insufficient stake - you need at least{" "}
                    {fromWei(votingPower.proposalThreshold)} staked LPT to
                    create a proposal.
                  </Box>
                ) : (
                  <></>
                )}

                <Button
                  size="3"
                  variant="primary"
                  disabled={
                    !sufficientStake ||
                    status !== "idle" ||
                    !txEnabled ||
                    !config
                  }
                  type="submit"
                  css={{
                    width: "100%",
                    "@bp3": {
                      marginLeft: "$3",
                      alignSelf: "flex-end",
                      width: "auto",
                    },
                  }}
                >
                  Create Proposal{" "}
                  {status === "pending" && (
                    <Spinner css={{ marginLeft: "$2" }} />
                  )}
                </Button>
              </>
            )}
          </Flex>
        </Box>
      </Container>
    </>
  );
};

CreateProposal.getLayout = getLayout;

export default CreateProposal;
