import { getLayout, LAYOUT_MAX_WIDTH } from "@layouts/main";
import { useRouter } from "next/router";
import { shortenAddress } from "@lib/utils";
import MarkdownRenderer from "@components/MarkdownRenderer";
import BottomDrawer from "@components/BottomDrawer";
import Spinner from "@components/Spinner";
import {
  Badge,
  Box,
  Button,
  Card,
  Container,
  Flex,
  Heading,
  Link,
  Text,
} from "@livepeer/design-system";
import dayjs from "@lib/dayjs";
import Head from "next/head";
import { useWindowSize } from "react-use";
import {
  useAccountAddress,
  useEnsData,
  useExplorerStore,
  useSnapshotProposal,
} from "../../hooks";
import FourZeroFour from "../404";
import { sentenceCase } from "change-case";
import { BadgeVariantByState } from "@components/SnapshotProposalRow";
import SnapshotVotingWidget from "@components/SnapshotVotingWidget";

const formatDateTime = (timestamp: number) => {
  const date = dayjs.unix(timestamp);
  const now = dayjs();
  let str = date.format("MMM D, YYYY");
  if (date.isAfter(now) && date.diff(now, "hour") < 24) {
    str += ` (in ${dayjs.duration(date.diff()).humanize()})`;
  }
  return str;
};

const Proposal = () => {
  const router = useRouter();
  const { width } = useWindowSize();
  const { setBottomDrawerOpen } = useExplorerStore();

  const { query } = router;

  const proposalId = query?.proposal?.toString();

  const accountAddress = useAccountAddress();
  const { data: proposal, error, isLoading } = useSnapshotProposal(proposalId);

  const proposerId = useEnsData(proposal?.author);

  const startDate = proposal ? dayjs.unix(proposal.start) : null;
  const endDate = proposal ? dayjs.unix(proposal.end) : null;
  const now = dayjs();

  if (error) {
    return <FourZeroFour />;
  }

  if (isLoading || !proposal) {
    return (
      <>
        <Head>
          <title>Livepeer Explorer - Governance</title>
        </Head>
        <Flex
          css={{
            height: "calc(100vh - 100px)",
            width: "100%",
            justifyContent: "center",
            alignItems: "center",
            "@bp3": {
              height: "100vh",
            },
          }}
        >
          <Spinner />
        </Flex>
      </>
    );
  }

  const isActive = proposal.state === "active";

  return (
    <>
      <Head>
        <title>Livepeer Explorer - Governance</title>
      </Head>
      <Container css={{ maxWidth: LAYOUT_MAX_WIDTH, marginTop: "$4", width: "100%" }}>
        <Flex>
          <Flex
            css={{
              flexDirection: "column",
              marginBottom: "$6",
              paddingRight: 0,
              paddingTop: "$2",
              width: "100%",
              "@bp3": {
                width: "75%",
                paddingRight: "$7",
              },
            }}
          >
            <Box css={{ marginBottom: "$4" }}>
              <Flex
                css={{
                  marginBottom: "$2",
                  alignItems: "center",
                }}
              >
                <Badge
                  size="2"
                  variant={BadgeVariantByState[proposal.state] || "neutral"}
                  css={{ textTransform: "capitalize", fontWeight: 700 }}
                >
                  {sentenceCase(proposal.state)}
                </Badge>
              </Flex>
              <Heading size="2" css={{ mb: "$2", fontWeight: 600 }}>
                {proposal.title}
              </Heading>
              <Text css={{ fontSize: "$1", color: "$neutral11" }}>
                Proposed by{" "}
                <Link href={`/accounts/${proposal.author}`}>
                  {proposerId?.name ?? shortenAddress(proposal.author)}
                </Link>
              </Text>
              <Text css={{ fontSize: "$1", color: "$neutral11" }}>
                {proposal.state === "pending" && startDate ? (
                  <Box>Voting starts on {formatDateTime(proposal.start)}</Box>
                ) : isActive && endDate ? (
                  <Box>Voting ongoing until ~{formatDateTime(proposal.end)}</Box>
                ) : endDate ? (
                  <Box>Voting ended on {formatDateTime(proposal.end)}</Box>
                ) : null}
              </Text>
              {isActive && (
                <Button
                  size="4"
                  variant="primary"
                  css={{
                    display: "flex",
                    marginTop: "$3",
                    marginRight: "$3",
                    "@bp3": {
                      display: "none",
                    },
                  }}
                  onClick={() => setBottomDrawerOpen(true)}
                >
                  Vote
                </Button>
              )}
            </Box>

            <Box>
              <Card
                css={{
                  padding: "$4",
                  border: "1px solid $neutral4",
                  marginBottom: "$3",
                }}
              >
                <Heading
                  css={{
                    fontSize: "$2",
                    color: "$neutral9",
                    textTransform: "uppercase",
                    fontWeight: 600,
                    marginBottom: "$2",
                  }}
                >
                  Description
                </Heading>
                <MarkdownRenderer>{proposal.body}</MarkdownRenderer>
              </Card>

              <Card
                css={{
                  padding: "$3",
                  border: "1px solid $neutral4",
                  marginBottom: "$3",
                }}
              >
                <Heading
                  css={{
                    fontSize: "$2",
                    color: "$neutral9",
                    textTransform: "uppercase",
                    fontWeight: 600,
                    marginBottom: "$2",
                  }}
                >
                  Information
                </Heading>
                <Flex css={{ justifyContent: "space-between", mb: "$2" }}>
                  <Text variant="neutral" size="2">
                    Voting System
                  </Text>
                  <Text size="2" css={{ fontWeight: 600 }}>
                    {sentenceCase(proposal.type)}
                  </Text>
                </Flex>
                <Flex css={{ justifyContent: "space-between", mb: "$2" }}>
                  <Text variant="neutral" size="2">
                    Start Date
                  </Text>
                  <Text size="2" css={{ fontWeight: 600 }}>
                    {formatDateTime(proposal.start)}
                  </Text>
                </Flex>
                <Flex css={{ justifyContent: "space-between", mb: "$2" }}>
                  <Text variant="neutral" size="2">
                    End Date
                  </Text>
                  <Text size="2" css={{ fontWeight: 600 }}>
                    {formatDateTime(proposal.end)}
                  </Text>
                </Flex>
                <Flex css={{ justifyContent: "space-between" }}>
                  <Text variant="neutral" size="2">
                    Snapshot
                  </Text>
                  <Link
                    href={`https://etherscan.io/block/${proposal.snapshot}`}
                    target="_blank"
                    css={{ fontWeight: 600 }}
                  >
                    <Text size="2" css={{ fontWeight: 600 }}>
                      {proposal.snapshot}
                    </Text>
                  </Link>
                </Flex>
              </Card>
            </Box>
          </Flex>

          {width > 1200 ? (
            <Flex
              css={{
                display: "none",
                "@bp3": {
                  position: "sticky",
                  alignSelf: "flex-start",
                  top: "$9",
                  marginTop: "$6",
                  width: "25%",
                  display: "flex",
                },
              }}
            >
              <SnapshotVotingWidget proposal={proposal} />
            </Flex>
          ) : (
            <BottomDrawer>
              <SnapshotVotingWidget proposal={proposal} />
            </BottomDrawer>
          )}
        </Flex>
      </Container>
    </>
  );
};

Proposal.getLayout = getLayout;

export default Proposal;
