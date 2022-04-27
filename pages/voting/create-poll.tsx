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
  Tooltip,
} from "@livepeer/design-system";
import { ArrowTopRightIcon } from "@modulz/radix-icons";
import { useWeb3React } from "@web3-react/core";
import { createApolloFetch } from "apollo-fetch";
import { CHAIN_INFO, DEFAULT_CHAIN_ID } from "constants/chains";
import fm from "front-matter";
import IPFS from "ipfs-mini";
import { getLayout } from "layouts/main";
import Head from "next/head";
import { useContext, useEffect, useState } from "react";
import { MutationsContext } from "../../contexts";
import { usePageVisibility } from "../../hooks";

const CreatePoll = ({ projectOwner, projectName, gitCommitHash, lips }) => {
  const context = useWeb3React();
  const isVisible = usePageVisibility();
  const [sufficientStake, setSufficientStake] = useState(false);
  const ipfs = new IPFS({
    host: "ipfs.infura.io",
    port: 5001,
    protocol: "https",
  });
  const pollInterval = 10000;

  const accountQuery = gql`
    query ($account: ID!) {
      delegator(id: $account) {
        id
        bondedAmount
      }
    }
  `;

  const { data, error, startPolling, stopPolling } = useQuery(accountQuery, {
    variables: {
      account: context.account?.toLowerCase(),
    },
    pollInterval,
    skip: !context.account,
  });

  useEffect(() => {
    if (!isVisible) {
      stopPolling();
    } else {
      startPolling(pollInterval);
    }
  }, [isVisible, startPolling, stopPolling]);

  useEffect(() => {
    if (data) {
      if (
        parseFloat(data.delegator.bondedAmount) >=
        (process.env.NEXT_PUBLIC_NETWORK === "ARBITRUM_RINKEBY" ? 10 : 100)
      ) {
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
            e.preventDefault();
            try {
              const hash = await ipfs.addJSON({
                ...selectedProposal,
              });
              await createPoll({
                variables: { proposal: hash },
              });
            } catch (err) {
              return {
                error: err.message.replace("GraphQL error: ", ""),
              };
            }
          }}
        >
          {lips && lips.length > 0 ? (
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
                  key={i.text}
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
          ) : (
            <Box>
              There are currently no LIPs in a proposed state for which there
              hasn&apos;t been a poll created yet.
            </Box>
          )}
          {context.account &&
            !!lips.length &&
            (!data ? (
              <Flex
                css={{
                  alignItems: "center",
                  mt: "$5",
                  justifyContent: "flex-end",
                }}
              >
                <Box css={{ mr: "$3" }}>Loading Staked LPT Balance</Box>
                <Spinner />
              </Flex>
            ) : (
              <Flex
                css={{
                  mt: "$5",
                  alignItems: "center",
                  justifyContent: "flex-end",
                }}
              >
                {!sufficientStake && (
                  <Box css={{ color: "$red11", fontSize: "$1" }}>
                    Insufficient stake - you need at least{" "}
                    {process.env.NEXT_PUBLIC_NETWORK === "ARBITRUM_RINKEBY"
                      ? 10
                      : 100}{" "}
                    staked LPT to create a poll.
                  </Box>
                )}

                <Button
                  size="3"
                  variant="primary"
                  disabled={!sufficientStake || !selectedProposal}
                  type="submit"
                  css={{ ml: "$3", alignSelf: "flex-end" }}
                >
                  Create Poll
                </Button>
              </Flex>
            ))}
        </Box>
      </Container>
    </>
  );
};

CreatePoll.getLayout = getLayout;

export default CreatePoll;

export async function getStaticProps() {
  const ipfs = new IPFS({
    host: "ipfs.infura.io",
    port: 5001,
    protocol: "https",
  });
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
        const obj = await ipfs.catJSON(poll.proposal);
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
