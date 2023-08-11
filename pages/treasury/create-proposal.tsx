import Spinner from "@components/Spinner";
import { livepeerGovernor } from "@lib/api/abis/main/LivepeerGovernor";
import { livepeerToken } from "@lib/api/abis/main/LivepeerToken";
import {
  getLivepeerGovernorAddress,
  getLivepeerTokenAddress,
  getTreasuryAddress,
} from "@lib/api/contracts";
import { fromWei, toWei } from "@lib/utils";
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  TextArea,
  TextField,
  Text,
} from "@livepeer/design-system";
import {
  useAccountAddress,
  useAccountBalanceData,
  useHandleTransaction,
  useTreasuryVotingPowerData,
} from "hooks";
import { getLayout, LAYOUT_MAX_WIDTH } from "layouts/main";
import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import { Address, encodeFunctionData, isAddress } from "viem";
import { useContractWrite, usePrepareContractWrite } from "wagmi";

const livepeerGovernorAddress = getLivepeerGovernorAddress();
const treasuryAddress = getTreasuryAddress();

type Mutable<T> = {
  -readonly [K in keyof T]: Mutable<T[K]>;
};

const CreateProposal = () => {
  const accountAddress = useAccountAddress();
  const treasuryAccountBalanceData = useAccountBalanceData(treasuryAddress);
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
    livepeerGovernorAddress &&
      livepeerTokenAddress &&
      transferTokenFunctionData &&
      description
  );
  const { config } = usePrepareContractWrite({
    enabled: txEnabled,
    address: livepeerGovernorAddress,
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
            <Text variant="neutral" align="left" size="3">
              Treasury Balance: {treasuryBalance} LPT
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
            value={formTitle}
            onChange={(e) => {
              setFormTitle(e.target.value);
            }}
          />
          <TextArea
            name="description"
            value={formDescription}
            onChange={(e) => {
              setFormDescription(e.target.value);
            }}
            css={{
              mt: "$5",
              height: 360,
              // "boxShadow:active": "$colors$primary8 inset 0px 0px 0px 1px",
            }}
            placeholder="Describe your proposal (markdown)"
            size="3"
          />
          <Flex
            css={{
              mt: "$5",
              alignItems: "center",
              justifyContent: "flex-start",
            }}
          >
            <Text variant="neutral" align="left" size="3">
              LPT receiver:
            </Text>
            <TextField
              css={{ ml: "$2", mr: "$3", width: 420 }}
              name="lpt-receiver"
              placeholder="Ethereum Address (0x...)"
              size="3"
              value={lptReceiver}
              onChange={(e) => {
                setLptReceiver(e.target.value);
              }}
            />
            <Text variant="neutral" align="left" size="3">
              Amount:
            </Text>
            <TextField
              css={{ ml: "$2", mr: "$1", width: 200, minWidth: 100 }}
              name="lpt-amount"
              placeholder="Amount in LPT"
              type="number"
              size="3"
              min="1"
              max={treasuryBalance}
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
                  variant="primary"
                  disabled={!sufficientStake || status !== "idle" || !txEnabled}
                  type="submit"
                  css={{ ml: "$3", alignSelf: "flex-end" }}
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
