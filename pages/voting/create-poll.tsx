import Spinner from "@components/Spinner";
import { pollCreator } from "@lib/api/abis/main/PollCreator";
import { getPollCreatorAddress } from "@lib/api/contracts";
import { PollLips } from "@lib/api/types/get-poll-lips";
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Link as A,
  RadioCard,
  RadioCardGroup,
} from "@livepeer/design-system";
import { ArrowTopRightIcon } from "@radix-ui/react-icons";
import { fromWei } from "@utils/web3";
import { useAccountQuery } from "apollo";
import { hexlify, toUtf8Bytes } from "ethers/lib/utils";
import { useAccountAddress, usePendingFeesAndStakeData } from "hooks";
import { useHandleTransaction } from "hooks/useHandleTransaction";
import { LAYOUT_MAX_WIDTH } from "layouts/constants";
import { getLayout } from "layouts/main";
import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { addIpfs } from "utils/ipfs";
import { useSimulateContract, useWriteContract } from "wagmi";

const pollCreatorAddress = getPollCreatorAddress();

const CreatePoll = () => {
  const accountAddress = useAccountAddress();
  const [sufficientStake, setSufficientStake] = useState(false);
  const [isCreatePollLoading, setIsCreatePollLoading] = useState(false);
  const { data: pollLips, error: lipsError } = useSWR<PollLips>("/polls/lips");
  const lips = useMemo(() => pollLips?.lips ?? [], [pollLips?.lips]);

  const [hash, setHash] = useState<string | null>(null);

  const { data, loading } = useAccountQuery({
    variables: {
      account: accountAddress?.toLowerCase() ?? "",
    },
    skip: !accountAddress,
  });

  const delegatorPendingStakeAndFees = usePendingFeesAndStakeData(
    data?.delegator?.id
  );

  useEffect(() => {
    if (delegatorPendingStakeAndFees?.pendingStake) {
      const lptPendingStake = parseFloat(
        fromWei(delegatorPendingStakeAndFees.pendingStake)
      );

      if (lptPendingStake >= 100) {
        setSufficientStake(true);
      } else {
        setSufficientStake(false);
      }
    }
  }, [delegatorPendingStakeAndFees]);

  const [selectedProposal, setSelectedProposal] = useState<{
    lip: string;
    gitCommitHash: string;
    text: string;
  } | null>(null);

  useEffect(() => {
    if (
      selectedProposal &&
      !lips.some((lip) => lip.attributes.lip === selectedProposal.lip)
    ) {
      setSelectedProposal(null);
    }
  }, [lips, selectedProposal]);

  const { data: config } = useSimulateContract({
    query: { enabled: Boolean(pollCreatorAddress && hash) },
    address: pollCreatorAddress,
    abi: pollCreator,
    functionName: "createPoll",
    args: [hash ? (hexlify(toUtf8Bytes(hash)) as `0x${string}`) : "0x"],
  });
  const {
    data: createPollResult,
    status,
    isPending,
    writeContract,
    error,
    isSuccess,
  } = useWriteContract();

  useHandleTransaction(
    "createPoll",
    createPollResult,
    error,
    isPending,
    isSuccess,
    {
      proposal: hash,
    }
  );

  useEffect(() => {
    if (hash && status === "idle") {
      if (!config) return;
      writeContract(config.request);
    }
  }, [config, hash, writeContract, status]);

  return (
    <>
      <Head>
        <title>Livepeer Explorer - Voting</title>
      </Head>
      <Container css={{ maxWidth: LAYOUT_MAX_WIDTH, width: "100%" }}>
        <Flex
          css={{
            marginTop: "$6",
            marginBottom: "$4",
          }}
        >
          <Heading size="2" as="h1" css={{ fontWeight: 700 }}>
            Create Poll
          </Heading>
        </Flex>
        <Box
          as="form"
          onSubmit={async (e) => {
            setIsCreatePollLoading(true);
            e.preventDefault();
            try {
              if (!selectedProposal) {
                return;
              }
              const hash = await addIpfs({
                gitCommitHash: selectedProposal.gitCommitHash,
                text: selectedProposal.text,
              });

              setHash(hash);
            } catch (err) {
              console.error(err);
              return {
                error: (err as Error)?.message?.replace("GraphQL error: ", ""),
              };
            } finally {
              setIsCreatePollLoading(false);
            }
          }}
        >
          {!pollLips && !lipsError ? (
            <Flex css={{ alignItems: "center" }}>
              <Box css={{ marginRight: "$3" }}>Loading LIPs</Box>
              <Spinner />
            </Flex>
          ) : lipsError ? (
            <Box css={{ color: "$red11" }}>
              Unable to load LIPs. Please try again shortly.
            </Box>
          ) : lips.length > 0 ? (
            <>
              <RadioCardGroup
                onValueChange={(value) => {
                  const selectedLip = lips.find(
                    (lip) => lip.attributes.lip === value
                  );
                  if (!selectedLip) {
                    setSelectedProposal(null);
                    return;
                  }

                  setSelectedProposal({
                    lip: selectedLip.attributes.lip,
                    gitCommitHash: pollLips!.gitCommitHash,
                    text: selectedLip.text,
                  });
                }}
              >
                {lips.map((lip) => (
                  <RadioCard
                    key={lip.attributes.lip}
                    value={lip.attributes.lip}
                    css={{
                      width: "100%",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "$4",
                      marginBottom: "$4",
                      display: "flex",
                      borderRadius: "$4",
                    }}
                  >
                    <Flex css={{ alignItems: "center", width: "100%" }}>
                      <Box css={{ marginLeft: "$3", width: "100%" }}>
                        LIP-{lip.attributes.lip} - {lip.attributes.title}
                      </Box>
                    </Flex>
                    <A
                      variant="primary"
                      css={{
                        display: "flex",
                        marginLeft: "$2",
                        minWidth: 108,
                      }}
                      target="_blank"
                      rel="noopener noreferrer"
                      href={`https://github.com/${pollLips!.projectOwner}/${
                        pollLips!.projectName
                      }/blob/${pollLips!.gitCommitHash}/LIPs/LIP-${
                        lip.attributes.lip
                      }.md`}
                    >
                      View Proposal
                      <ArrowTopRightIcon />
                    </A>
                  </RadioCard>
                ))}
              </RadioCardGroup>
              <Flex
                css={{
                  marginTop: "$5",
                  alignItems: "center",
                  justifyContent: "flex-end",
                }}
              >
                {loading ? (
                  <>
                    <Box css={{ marginRight: "$3" }}>
                      Loading Staked LPT Balance
                    </Box>
                    <Spinner />
                  </>
                ) : (
                  <>
                    {!accountAddress ? (
                      <Box css={{ color: "$red11", fontSize: "$1" }}>
                        Connect your wallet to create a poll.
                      </Box>
                    ) : !sufficientStake ? (
                      <Box css={{ color: "$red11", fontSize: "$1" }}>
                        Insufficient stake - you need at least 100 staked LPT to
                        create a poll.
                      </Box>
                    ) : (
                      <></>
                    )}

                    <Button
                      size="3"
                      variant="primary"
                      disabled={
                        !sufficientStake ||
                        !selectedProposal ||
                        !data ||
                        !accountAddress ||
                        isCreatePollLoading
                      }
                      type="submit"
                      css={{ marginLeft: "$3", alignSelf: "flex-end" }}
                    >
                      Create Poll{" "}
                      {isCreatePollLoading && (
                        <Spinner css={{ marginLeft: "$2" }} />
                      )}
                    </Button>
                  </>
                )}
              </Flex>
            </>
          ) : (
            <Box>
              There are currently no LIPs in a proposed state for which there
              hasn&apos;t been a poll created yet.
            </Box>
          )}
        </Box>
      </Container>
    </>
  );
};

CreatePoll.getLayout = getLayout;

export default CreatePoll;
