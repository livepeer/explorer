import { gql, useQuery } from "@apollo/client";
import Spinner from "@components/Spinner";
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
import { useWeb3React } from "@web3-react/core";
import { createApolloFetch } from "apollo-fetch";
import { CHAIN_INFO, DEFAULT_CHAIN_ID } from "constants/chains";
import fm from "front-matter";
import { getLayout } from "layouts/main";
import Head from "next/head";
import { useContext, useEffect, useState } from "react";
import { addIpfs, catIpfsJson, IpfsPoll } from "utils/ipfs";
import Utils from "web3-utils";
import { MutationsContext } from "../../contexts";

const CreatePoll = ({ projectOwner, projectName, gitCommitHash, lips }) => {
  const context = useWeb3React();
  const [sufficientStake, setSufficientStake] = useState(false);
  const [isCreatePollLoading, setIsCreatePollLoading] = useState(false);

  const accountQuery = gql`
    query ($account: ID!) {
      delegator(id: $account) {
        id
        pendingStake
      }
    }
  `;

  const { data, loading } = useQuery(accountQuery, {
    variables: {
      account: context.account?.toLowerCase(),
    },
    skip: !context.account,
  });

  useEffect(() => {
    if (data?.delegator?.pendingStake) {
      const lptPendingStake = parseFloat(
        Utils.fromWei(data.delegator.pendingStake)
      );

      if (lptPendingStake >= 100) {
        setSufficientStake(true);
      } else {
        setSufficientStake(false);
      }
    }
  }, [data, context.account]);

  const [selectedProposal, setSelectedProposal] = useState(null);
  const { createPoll }: any = useContext(MutationsContext);

  return (
    <>
      <Head>
        <title>Livepeer Explorer - Voting</title>
      </Head>
      <Container size="3" css={{ width: "100%" }}>
        <Flex
          css={{
            mt: "$6",
            mb: "$4",
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
              const hash = await addIpfs(selectedProposal);

              await createPoll({
                variables: { proposal: hash },
              });
            } catch (err) {
              console.error(err);
              return {
                error: err.message.replace("GraphQL error: ", ""),
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
                      p: "$4",
                      mb: "$4",
                      display: "flex",
                      borderRadius: "$4",
                    }}
                  >
                    <Flex css={{ alignItems: "center", width: "100%" }}>
                      <Box css={{ ml: "$3", width: "100%" }}>
                        LIP-{lip.attributes.lip} - {lip.attributes.title}
                      </Box>
                    </Flex>
                    <A
                      variant="primary"
                      css={{
                        display: "flex",
                        ml: "$2",
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
                  mt: "$5",
                  alignItems: "center",
                  justifyContent: "flex-end",
                }}
              >
                {loading ? (
                  <>
                    <Box css={{ mr: "$3" }}>Loading Staked LPT Balance</Box>
                    <Spinner />
                  </>
                ) : (
                  <>
                    {!context.account ? (
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
                        !context.account ||
                        isCreatePollLoading
                      }
                      type="submit"
                      css={{ ml: "$3", alignSelf: "flex-end" }}
                    >
                      Create Poll{" "}
                      {isCreatePollLoading && <Spinner css={{ ml: "$2" }} />}
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

export async function getStaticProps() {
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
  const { data } = await apolloFetch({ query: lipsQuery });
  const apolloSubgraphFetch = createApolloFetch({
    uri: CHAIN_INFO[DEFAULT_CHAIN_ID].subgraph,
  });
  const { data: pollsData } = await apolloSubgraphFetch({
    query: `{ polls { proposal } }`,
  });

  const createdPolls = [];
  if (pollsData) {
    await Promise.all(
      pollsData.polls.map(async (poll) => {
        const obj = await catIpfsJson<IpfsPoll>(poll?.proposal);

        // check if proposal is valid format {text, gitCommitHash}
        if (obj?.text && obj?.gitCommitHash) {
          const transformedProposal = fm(obj.text);
          createdPolls.push(transformedProposal.attributes.lip);
        }
      })
    );
  }

  const lips = [];
  if (data) {
    for (const lip of data.repository.content.entries) {
      const transformedLip = fm(lip.content.text);
      transformedLip.attributes.created =
        transformedLip.attributes.created.toString();
      if (
        transformedLip.attributes.status === "Proposed" &&
        !transformedLip.attributes["part-of"] &&
        !createdPolls.includes(transformedLip.attributes.lip)
      )
        lips.push({ ...transformedLip, text: lip.content.text });
    }
  }

  return {
    props: {
      projectOwner: data ? data.repository.owner.login : null,
      projectName: data ? data.repository.name : null,
      gitCommitHash: data ? data.repository.defaultBranchRef.target.oid : null,
      lips: lips.sort((a, b) => (a.attributes.lip < b.attributes.lip ? 1 : -1)),
    },
    revalidate: 1,
  };
}
