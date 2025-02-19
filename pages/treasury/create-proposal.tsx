import Spinner from "@components/Spinner";
import MarkdownRenderer from "@components/MarkdownRenderer";
import { livepeerGovernor } from "@lib/api/abis/main/LivepeerGovernor";
import { livepeerToken } from "@lib/api/abis/main/LivepeerToken";
import {
  getLivepeerTokenAddress,
} from "@lib/api/contracts";
import { abbreviateNumber, fromWei, toWei } from "@lib/utils";
import {
  Box,
  Container,
  Flex,
  Heading,
  TextArea,
  TextField,
  Text,
  styled,
  Card,
} from "@jjasonn.stone/design-system";
import { Button } from "@components/Button";
import {
  useAccountAddress,
  useAccountBalanceData,
  useContractInfoData,
  useHandleTransaction,
  useTreasuryVotingPowerData,
} from "hooks";
import { getLayout, LAYOUT_MAX_WIDTH } from "layouts/main";
import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import { Address, encodeFunctionData, isAddress } from "viem";
import { useContractWrite, usePrepareContractWrite } from "wagmi";
import { Tab, TabList, TabPanel, TabPanels, Tabs } from "@reach/tabs";
import remarkGfm from "remark-gfm";

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
    color: "$green11",
    border: "2px solid $green11",
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
  const { config } = usePrepareContractWrite({
    enabled: txEnabled,
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
    isLoading,
    write,
    error,
    isSuccess,
  } = useContractWrite(config);

  useHandleTransaction("propose", proposeResult, error, isLoading, isSuccess, {
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
          width: "61.8%",
        }}
      >
        <Flex
          css={{
            mt: "$6",
            mb: "$4",
            alignItems: "flex-end",
            justifyContent: "space-between",
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
              console.log("submitting!");
              write?.();
            } catch (err: any) {
              console.error(err);
              return {
                error: err.message ?? err.toString(),
              };
            }
          }}
        >
          <TextField
            name="title"
            placeholder="Title"
            size="3"
            variant="white"
            value={formTitle}
            onChange={(e) => {
              setFormTitle(e.target.value);
            }}
            css={{
              marginBottom: "$5",
              bc: "$gray1",
              "&:focus": {
                boxShadow: "inset 0px 0px 0px 1px $colors$green8, 0px 0px 0px 1px $colors$green8",
                bc: "$gray1",
              },
              "&:hover": {
                boxShadow: "inset 0px 0px 0px 1px $colors$green8, 0px 0px 0px 1px $colors$green8",
              } 
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
                    height: 360,
                    borderTopLeftRadius: "0",
                  }}
                  placeholder="Describe your proposal (markdown)"
                  size="3"
                />
              </TabPanel>
              <TabPanel style={{ paddingBottom: "3.32px" }}>
                <Card
                  css={{
                    minHeight: 360,
                    boxShadow: "inset 0 0 0 1px $colors$neutral7",
                    borderRadius: "$2",
                    borderTopLeftRadius: "0",
                    backgroundColor: "$panel",

                    // Apply same card styling as proposal page.
                    p: "$4",
                    // border: "1px solid $neutral4",
                    // mb: "$3",
                    h2: {
                      fontWeight: 600,
                      "&:first-of-type": { mt: 0 },
                      mt: "$3",
                    },
                    h3: { fontWeight: 600, mt: "$3" },
                    h4: { fontWeight: 600, mt: "$3" },
                    h5: { fontWeight: 600, mt: "$3" },
                    lineHeight: 1.5,
                    a: {
                      color: "$green11",
                    },
                    pre: {
                      whiteSpace: "pre-wrap",
                    },
                  }}
                >
                  <MarkdownRenderer remarkPlugins={[remarkGfm]}>
                    {`# ${formTitle}\n${formDescription}`}
                  </MarkdownRenderer>
                </Card>
              </TabPanel>
            </TabPanels>
          </Tabs>
          <Flex
            css={{
              mt: "$5",
              alignItems: "center",
              justifyContent: "flex-start",
            }}
          >
            <Text variant="neutral" size="3">
              LPT receiver:
            </Text>
            <TextField
              css={{ ml: "$2", mr: "$3", width: 420, bc: "$gray1",
                "&:focus": {
                  boxShadow: "inset 0px 0px 0px 1px $colors$green8, 0px 0px 0px 1px $colors$green8",
                  bc: "$gray1",
                },
                "&:hover": {
                  boxShadow: "inset 0px 0px 0px 1px $colors$green8, 0px 0px 0px 1px $colors$green8",
                } 
              }}
              name="lpt-receiver"
              placeholder="Ethereum Address (0x...)"
              size="3"
              variant="white"
              value={lptReceiver}
              onChange={(e) => {
                setLptReceiver(e.target.value);
              }}
            />
            <Text variant="neutral" size="3">
              Amount:
            </Text>
            <TextField
              css={{ ml: "$2", mr: "$1", width: 200, minWidth: 100, bc: "$gray1",
                "&:focus": {
                  boxShadow: "inset 0px 0px 0px 1px $colors$green8, 0px 0px 0px 1px $colors$green8",
                  bc: "$gray1",
                },
                "&:hover": {
                  boxShadow: "inset 0px 0px 0px 1px $colors$green8, 0px 0px 0px 1px $colors$green8",
                } 
              }}
              name="lpt-amount"
              placeholder="Amount in LPT"
              type="number"
              size="3"
              variant="white"
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

          <Flex
            css={{
              mt: "$5",
              alignItems: "center",
              justifyContent: "flex-end",
            }}
          >
            {!accountAddress ? (
              <Box css={{ color: "$red11", fontSize: "$1" }}>
                Connect your wallet to create a proposal.
              </Box>
            ) : !votingPower ? (
              <>
                <Box css={{ mr: "$3" }}>Loading Staked LPT Balance</Box>
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
                  disabled={!sufficientStake || status !== "idle" || !txEnabled}
                  type="submit"
                  color="green"
                  css={{ml: "$3", cursor:" pointer",
                    "&:disabled": {
                      cursor: "not-allowed"
                  }}}
                >
                  Create Proposal{" "}
                  {status === "loading" && <Spinner css={{ ml: "$2" }} />}
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
