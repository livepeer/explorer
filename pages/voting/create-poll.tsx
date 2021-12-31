import { getLayout } from "layouts/main";
import IPFS from "ipfs-mini";
import fm from "front-matter";
import { createApolloFetch } from "apollo-fetch";
import { useState, useEffect, useContext } from "react";
import { useWeb3React } from "@web3-react/core";
import PollTokenApproval from "@components/PollTokenApproval";
import { useQuery, gql } from "@apollo/client";
import { useApolloClient } from "@apollo/client";
import { MutationsContext } from "core/contexts";
import Utils from "web3-utils";
import Head from "next/head";
import { usePageVisibility } from "core/hooks";
import Spinner from "@components/Spinner";
import {
  Box,
  Flex,
  Button,
  Container,
  Heading,
  Link as A,
  RadioCardGroup,
  RadioCard,
} from "@livepeer/design-system";
import { ArrowTopRightIcon } from "@modulz/radix-icons";
import { CHAIN_INFO, DEFAULT_CHAIN_ID } from "constants/chains";

const CreatePoll = ({ projectOwner, projectName, gitCommitHash, lips }) => {
  const context = useWeb3React();
  const client = useApolloClient();
  const isVisible = usePageVisibility();
  const [sufficientAllowance, setSufficientAllowance] = useState(false);
  const [sufficientBalance, setSufficientBalance] = useState(false);
  const ipfs = new IPFS({
    host: "ipfs.infura.io",
    port: 5001,
    protocol: "https",
  });
  const pollInterval = 10000;

  const accountQuery = gql`
    query ($account: ID!) {
      account(id: $account) {
        pollCreatorAllowance
        tokenBalance
      }
    }
  `;

  const { data, startPolling, stopPolling } = useQuery(accountQuery, {
    variables: {
      account: context.account,
    },
    pollInterval,
    context: {
      library: context.library,
    },
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
        parseFloat(Utils.fromWei(data.account.pollCreatorAllowance)) >=
        (process.env.NEXT_PUBLIC_NETWORK === "RINKEBY" ? 10 : 100)
      ) {
        setSufficientAllowance(true);
      } else {
        setSufficientAllowance(false);
      }
      if (
        parseFloat(Utils.fromWei(data.account.tokenBalance)) >=
        (process.env.NEXT_PUBLIC_NETWORK === "RINKEBY" ? 10 : 100)
      ) {
        setSufficientBalance(true);
      } else {
        setSufficientBalance(false);
      }
    }
  }, [data, context.account]);

  const [selectedProposal, setSelectedProposal] = useState(null);
  const { createPoll }: any = useContext(MutationsContext);

  useEffect(() => {
    if (lips.length) {
      setSelectedProposal({ gitCommitHash, text: lips[0].text });
    }
  }, [gitCommitHash, lips]);

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
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Heading size="2">Create Poll</Heading>
          {!context.account && (
            <Button
              css={{
                display: "none",
                "@bp3": {
                  display: "block",
                },
              }}
              onClick={() => {
                client.writeQuery({
                  query: gql`
                    query {
                      walletModalOpen
                    }
                  `,
                  data: {
                    walletModalOpen: true,
                  },
                });
              }}
            >
              Connect Wallet
            </Button>
          )}
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
          {!lips?.length && (
            <Box>
              There are currently no LIPs in a proposed state for which there
              hasn&apos;t been a poll created yet.
            </Box>
          )}
          <RadioCardGroup
            defaultValue={selectedProposal}
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
          {context.account &&
            !!lips.length &&
            (!data ? (
              <Flex
                css={{
                  alignItems: "center",
                  mt: "$5",
                  justifyContent: "center",
                }}
              >
                <Box css={{ mr: "$3" }}>Loading LPT Balance</Box>
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
                {!sufficientAllowance && <PollTokenApproval />}
                {sufficientAllowance && !sufficientBalance && (
                  <Box css={{ color: "$muted", fontSize: "$1" }}>
                    Insufficient balance. You need at least{" "}
                    {process.env.NEXT_PUBLIC_NETWORK === "RINKEBY" ? 10 : 100}{" "}
                    LPT to create a poll.
                  </Box>
                )}
                <Button
                  size="3"
                  variant="primary"
                  disabled={!sufficientAllowance || !sufficientBalance}
                  type="submit"
                  css={{ ml: "$3", alignSelf: "flex-end" }}
                >
                  Create Poll (
                  {process.env.NEXT_PUBLIC_NETWORK === "RINKEBY" ? "10" : "100"}{" "}
                  LPT)
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
      process.env.NEXT_PUBLIC_NETWORK === "MAINNET" ? "livepeer" : "adamsoffer"
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
