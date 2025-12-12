import ErrorComponent from "@components/Error";
import Spinner from "@components/Spinner";
import { pollCreator } from "@lib/api/abis/main/PollCreator";
import { getPollCreatorAddress } from "@lib/api/contracts";
import { fromWei } from "@lib/utils";
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
import { ArrowTopRightIcon } from "@modulz/radix-icons";
import { useAccountQuery } from "apollo";
import { createApolloFetch } from "apollo-fetch";
import { hexlify, toUtf8Bytes } from "ethers/lib/utils";
import fm from "front-matter";
import {
  useAccountAddress,
  useHandleTransaction,
  usePendingFeesAndStakeData,
} from "hooks";
import { getLayout, LAYOUT_MAX_WIDTH } from "layouts/main";
import { CHAIN_INFO, DEFAULT_CHAIN_ID } from "lib/chains";
import Head from "next/head";
import { useEffect, useState } from "react";
import { addIpfs, catIpfsJson, IpfsPoll } from "utils/ipfs";
import { Address } from "viem";
import { useSimulateContract, useWriteContract } from "wagmi";

const pollCreatorAddress = getPollCreatorAddress();

const CreatePoll = ({
  hadError,
  projectOwner,
  projectName,
  gitCommitHash,
  lips,
}) => {
  const accountAddress = useAccountAddress();
  const [sufficientStake, setSufficientStake] = useState(false);
  const [isCreatePollLoading, setIsCreatePollLoading] = useState(false);

  const [hash, setHash] = useState<Address | null>(null);

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
    gitCommitHash: string;
    text: string;
  } | null>(null);

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

  if (hadError) {
    return <ErrorComponent statusCode={500} />;
  }

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
              const hash = await addIpfs(selectedProposal);

              setHash(hash as Address);
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
          {lips && lips.length > 0 ? (
            <>
              <RadioCardGroup
                onValueChange={(value) => {
                  setSelectedProposal({
                    gitCommitHash,
                    text: lips[value].text,
                  });
                }}
              >
                {lips.map((lip, i) => (
                  <RadioCard
                    key={i}
                    value={i.toString()}
                    css={{
                      width: "100%",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "$4",
                      marginBottom: "$4",
                      display: "flex",
                      borderRadius: "$4",
                    }}
                    onPointerEnterCapture={undefined}
                    onPointerLeaveCapture={undefined}
                    placeholder={undefined}
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
                      href={`https://github.com/${projectOwner}/${projectName}/blob/master/LIPs/LIP-${lip.attributes.lip}.md`}
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

type TransformedProposal = {
  attributes: {
    lip: string;
  };
};

type TransformedLip = {
  attributes: {
    lip: string;
    title: string;
    status: string;
    created: string;
    "part-of"?: string;
  };
  text: string;
};

export async function getStaticProps() {
  try {
    const lipsQuery = `
    {
      repository(owner: "${
        process.env.NEXT_PUBLIC_GITHUB_LIP_NAMESPACE
          ? process.env.NEXT_PUBLIC_GITHUB_LIP_NAMESPACE
          : "livepeer"
      }", name: "LIPS") {
        owner {
          login
        }
        name
        defaultBranchRef {
          target {
            oid
          }
        }
        content: object(expression: "master:LIPs/") {
          ... on Tree {
            entries {
              content: object {
                commitResourcePath
                ... on Blob {
                  text
                }
              }
            }
          }
        }
      }
    }
    `;

    const apolloFetch = createApolloFetch({
      uri: "https://api.github.com/graphql",
    });

    apolloFetch.use(({ options }, next) => {
      if (!options.headers) {
        options.headers = {}; // Create the headers object if needed.
      }
      options.headers[
        "authorization"
      ] = `Bearer ${process.env.GITHUB_ACCESS_TOKEN}`;

      next();
    });
    const result = await apolloFetch({ query: lipsQuery });
    const apolloSubgraphFetch = createApolloFetch({
      uri: CHAIN_INFO[DEFAULT_CHAIN_ID].subgraph,
    });
    const { data: pollsData } = await apolloSubgraphFetch({
      query: `{ polls { proposal } }`,
    });

    const createdPolls: string[] = [];
    if (pollsData) {
      await Promise.all(
        pollsData.polls.map(async (poll) => {
          const obj = await catIpfsJson<IpfsPoll>(poll?.proposal);

          // check if proposal is valid format {text, gitCommitHash}
          if (obj?.text && obj?.gitCommitHash) {
            const transformedProposal = fm(obj.text) as TransformedProposal;
            createdPolls.push(transformedProposal.attributes.lip);
          }
        })
      );
    }

    const lips: TransformedLip[] = [];
    if (result.data) {
      for (const lip of result.data.repository.content.entries) {
        const transformedLip = fm(
          lip.content.text
        ) as unknown as TransformedLip;
        transformedLip.attributes.created =
          transformedLip.attributes.created.toString();
        if (
          transformedLip.attributes.status === "Proposed" &&
          !transformedLip.attributes["part-of"] &&
          !createdPolls.includes(transformedLip.attributes.lip)
        )
          lips.push({ ...transformedLip, text: lip.content.text });
      }
    } else {
      console.log(
        `No data from apollo fetch: ${JSON.stringify(result, null, 2)}`
      );
    }

    return {
      props: {
        projectOwner: result?.data ? result.data.repository.owner.login : null,
        projectName: result?.data ? result.data.repository.name : null,
        gitCommitHash: result?.data
          ? result.data.repository.defaultBranchRef.target.oid
          : null,
        lips: lips.sort((a, b) =>
          a?.attributes?.lip < b?.attributes?.lip ? 1 : -1
        ),
      },
      revalidate: 300,
    };
  } catch (e) {
    console.log(e);
    return {
      props: {
        hadError: true,
      },
      revalidate: 60,
    };
  }
}
