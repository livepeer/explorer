import Stat from "@components/Stat";
import dayjs from "@lib/dayjs";
import { Box, Flex, Link as A, Text } from "@livepeer/design-system";
import { ArrowTopRightIcon, CheckIcon, Cross1Icon } from "@modulz/radix-icons";
import {
  AccountQueryResult,
  useTranscoderActivationHistoryQuery,
  useTreasuryProposalsQuery,
  useTreasuryVotesQuery,
} from "apollo";
import { useScoreData } from "hooks";
import { useRegionsData } from "hooks/useSwr";
import Link from "next/link";
import numbro from "numbro";
import { useMemo } from "react";
import Masonry from "react-masonry-css";

const breakpointColumnsObj = {
  default: 2,
  1100: 2,
  700: 2,
  500: 1,
};

interface Props {
  transcoder?: NonNullable<AccountQueryResult["data"]>["transcoder"];
  currentRound?: NonNullable<
    NonNullable<AccountQueryResult["data"]>["protocol"]
  >["currentRound"];
  isActive: boolean;
}

type ActivationWindow = { start: number; end: number };
type Participation = { voted: number; eligible: number };

const buildActiveWindows = (
  activations: { activationRound: string }[],
  deactivations: { deactivationRound: string }[]
): ActivationWindow[] => {
  const timeline = [
    ...activations.map((a) => ({
      round: Number(a.activationRound),
      type: "activation" as const,
    })),
    ...deactivations.map((d) => ({
      round: Number(d.deactivationRound),
      type: "deactivation" as const,
    })),
  ].sort((a, b) => a.round - b.round || (a.type === "deactivation" ? -1 : 1));

  const windows: ActivationWindow[] = [];
  let start: number | null = null;

  for (const { type, round } of timeline) {
    if (type === "activation") {
      if (start === null) {
        start = round;
      }
    } else if (start !== null && round >= start) {
      windows.push({ start, end: round });
      start = null;
    }
  }

  return start !== null
    ? [...windows, { start, end: Number.POSITIVE_INFINITY }]
    : windows;
};

const isDuringWindow = (round: number, windows: ActivationWindow[]) =>
  windows.some((w) => round >= w.start && round < w.end);

const isActiveProposal = (voteStart: string, currentRoundId?: string) =>
  currentRoundId ? Number(voteStart) <= Number(currentRoundId) : true;

const useGovernanceParticipation = (
  delegateId?: string,
  currentRoundId?: string
): { treasury: Participation | null; loading: boolean } => {
  const hasDelegate = Boolean(delegateId);

  const { data: activationData, loading: activationLoading } =
    useTranscoderActivationHistoryQuery({
      ...(hasDelegate ? { variables: { delegate: delegateId! } } : {}),
      fetchPolicy: "cache-and-network",
      skip: !hasDelegate,
    });

  const { data: votesData, loading: votesLoading } = useTreasuryVotesQuery({
    ...(hasDelegate ? { variables: { where: { voter: delegateId! } } } : {}),
    fetchPolicy: "cache-and-network",
    skip: !hasDelegate,
  });

  const activations = useMemo(
    () => activationData?.transcoderActivatedEvents ?? [],
    [activationData?.transcoderActivatedEvents]
  );
  const deactivations = useMemo(
    () => activationData?.transcoderDeactivatedEvents ?? [],
    [activationData?.transcoderDeactivatedEvents]
  );

  const firstActivationRound = activations[0]?.activationRound;

  const windows = useMemo(
    () => buildActiveWindows(activations, deactivations),
    [activations, deactivations]
  );

  const { data: proposalsData, loading: proposalsLoading } =
    useTreasuryProposalsQuery({
      variables: firstActivationRound
        ? { where: { voteStart_gte: firstActivationRound } }
        : undefined,
      skip: !firstActivationRound,
      fetchPolicy: "cache-and-network",
    });

  const treasuryParticipation = useMemo<Participation | null>(() => {
    if (!proposalsData || !votesData) return null;
    if (!firstActivationRound) return null;

    const eligible = proposalsData.treasuryProposals.filter(
      (proposal) =>
        isActiveProposal(proposal.voteStart, currentRoundId) &&
        isDuringWindow(Number(proposal.voteStart), windows)
    ).length;
    const voted = votesData.treasuryVotes.filter(
      (vote) =>
        isActiveProposal(vote.proposal.voteStart, currentRoundId) &&
        isDuringWindow(Number(vote.proposal.voteStart), windows)
    ).length;
    return { voted, eligible };
  }, [proposalsData, votesData, firstActivationRound, windows, currentRoundId]);

  return {
    treasury: treasuryParticipation,
    loading: activationLoading || votesLoading || proposalsLoading,
  };
};

const Index = ({ currentRound, transcoder, isActive }: Props) => {
  const callsMade = useMemo(
    () => transcoder?.pools?.filter((r) => r.rewardTokens != null)?.length ?? 0,
    [transcoder?.pools]
  );

  const scores = useScoreData(transcoder?.id);
  const knownRegions = useRegionsData();
  const { treasury: govStats } = useGovernanceParticipation(
    transcoder?.id,
    currentRound?.id
  );

  const maxScore = useMemo(() => {
    const topTransData = Object.keys(scores?.scores ?? {}).reduce(
      (prev, curr) => {
        const score = scores?.scores[curr];
        const region =
          knownRegions?.regions?.find((r) => r.id === curr)?.name ?? "N/A";
        if (
          score &&
          score >= prev.score &&
          !region.toLowerCase().startsWith("global")
        ) {
          return {
            region: region,
            score: scores?.scores[curr],
          };
        }
        return prev;
      },
      { region: "N/A", score: 0 }
    );
    return {
      transcoding: topTransData,
      ai: scores?.topAIScore,
    };
  }, [knownRegions?.regions, scores]);

  const maxScoreOutput = useMemo(() => {
    const outputTrans =
      maxScore.transcoding?.score && maxScore.transcoding?.score > 0;
    const transcodingInfo = outputTrans
      ? `${numbro(maxScore.transcoding?.score).divide(100).format({
          output: "percent",
          mantissa: 1,
        })} - ${maxScore.transcoding.region}`
      : "";
    return outputTrans ? transcodingInfo : "N/A";
  }, [maxScore]);

  const maxAIScoreOutput = useMemo(() => {
    const outputAI = maxScore.ai?.value && maxScore.ai?.value > 0;
    const region =
      knownRegions?.regions?.find((r) => r.id === maxScore.ai?.region)?.name ??
      "N/A";
    const aiInfo = outputAI ? (
      <>
        {numbro(maxScore.ai?.value).format({
          output: "percent",
          mantissa: 1,
        })}{" "}
        - {region}
      </>
    ) : (
      ""
    );
    return outputAI
      ? {
          score: aiInfo,
          modelText: `. The pipeline and model for this Orchestrator was '${maxScore.ai?.pipeline}' and '${maxScore.ai?.model}'`,
        }
      : { score: "N/A", modelText: "" };
  }, [knownRegions?.regions, maxScore]);

  const govParticipation =
    govStats && govStats.eligible > 0 ? govStats.voted / govStats.eligible : 0;

  return (
    <Box
      css={{
        paddingTop: "$4",
        ".masonry-grid": {
          display: "flex",
          marginLeft: "-$3",
          width: "auto",
        },
        ".masonry-grid_column": {
          paddingLeft: "$3",
          backgroundClip: "padding-box",
        },

        ".masonry-grid_column > .masonry-grid_item": {
          marginBottom: "$3",
        },
      }}
    >
      <Masonry
        breakpointCols={breakpointColumnsObj}
        className="masonry-grid"
        columnClassName="masonry-grid_column"
      >
        <Stat
          className="masonry-grid_item"
          label="Total Delegated Stake"
          tooltip={
            "The total amount of stake delegated to this orchestrator (including their own self-stake)."
          }
          value={
            transcoder
              ? `${numbro(transcoder?.totalStake || 0).format({
                  mantissa: 2,
                  average: true,
                })} LPT`
              : "N/A"
          }
        />
        <Stat
          className="masonry-grid_item"
          label="Status"
          tooltip={`The status of the orchestrator on the network.`}
          value={
            isActive
              ? `Active ${
                  transcoder?.activationTimestamp
                    ? dayjs.unix(transcoder?.activationTimestamp).fromNow(true)
                    : ""
                }`
              : "Inactive"
          }
        />
        <Stat
          className="masonry-grid_item"
          css={{ fontSize: "20px" }}
          label="Top Transcoding Regional Score"
          tooltip={`The Orchestrator's score for its best operational transcodingregion in the past 24 hours.`}
          value={maxScoreOutput}
        />
        <Stat
          className="masonry-grid_item"
          css={{ fontSize: "20px" }}
          label="Top AI Regional Score"
          tooltip={`The Orchestrator's score for its best operational AI region in the past 24 hours${maxAIScoreOutput.modelText}.`}
          value={maxAIScoreOutput.score}
        />
        <Stat
          className="masonry-grid_item"
          label="Earned Fees"
          tooltip={
            "The total amount of fees this orchestrator has earned (since the migration to Arbitrum One)."
          }
          value={`${numbro(transcoder?.totalVolumeETH || 0).format({
            mantissa: 2,
            average: true,
          })} ETH`}
        />
        <Stat
          className="masonry-grid_item"
          label="Price / Pixel"
          tooltip="The most recent price for transcoding which the orchestrator is currently advertising off-chain to gateways. This may be different from on-chain pricing."
          value={
            scores
              ? `${numbro(
                  (scores?.pricePerPixel || 0) <= 0 ? 0 : scores.pricePerPixel
                ).format({
                  mantissa: 1,
                  thousandSeparated: true,
                })} WEI`
              : "N/A"
          }
        />
        {/* <Stat
          className="masonry-grid_item"
          label="Total Delegators"
          tooltip={
            "The number of delegators which have delegated stake to this orchestrator."
          }
          value={`${numbro(transcoder?.delegators?.length || 0).format(
            "0,0"
          )}`}
        /> */}
        <Stat
          className="masonry-grid_item"
          label="Fee Cut"
          tooltip={
            "The percent of the transcoding fees which are kept by the orchestrator, with the remainder distributed to its delegators by percent stake."
          }
          value={
            transcoder?.feeShare
              ? numbro(1 - +(transcoder?.feeShare || 0) / 1000000).format({
                  output: "percent",
                  mantissa: 0,
                })
              : "N/A"
          }
        />
        <Stat
          className="masonry-grid_item"
          label="Reward Cut"
          tooltip={
            "The percent of the inflationary reward fees which are kept by the orchestrator, with the remainder distributed to its delegators by percent stake."
          }
          value={
            transcoder?.rewardCut
              ? numbro(transcoder?.rewardCut || 0)
                  .divide(1000000)
                  .format({
                    output: "percent",
                    mantissa: 0,
                  })
              : "N/A"
          }
        />
        <Stat
          className="masonry-grid_item"
          label="Reward Calls"
          tooltip={
            "The number of times this orchestrator has requested inflationary rewards over the past thirty rounds. A lower ratio than 30/30 indicates this orchestrator has missed rewards for a round."
          }
          value={
            transcoder
              ? `${callsMade}/${transcoder?.pools?.length ?? 0}`
              : "N/A"
          }
        />
        {transcoder?.lastRewardRound?.id && (
          <Stat
            className="masonry-grid_item"
            tooltip={
              "The last round that an orchestrator received rewards while active - a checkmark indicates that reward was called for the current round."
            }
            label="Last Reward Round"
            value={
              <Flex css={{ alignItems: "center" }}>
                {transcoder.lastRewardRound.id}{" "}
                {isActive && (
                  <Flex>
                    {transcoder.lastRewardRound.id === currentRound?.id ? (
                      <Box
                        as={CheckIcon}
                        css={{
                          fontSize: "$3",
                          color: "$green11",
                          marginLeft: "$2",
                        }}
                      />
                    ) : (
                      <Box
                        as={Cross1Icon}
                        css={{
                          fontSize: "$2",
                          color: "$red11",
                          marginLeft: "$2",
                        }}
                      />
                    )}
                  </Flex>
                )}
              </Flex>
            }
          />
        )}
        <A
          as={Link}
          href={`/accounts/${transcoder?.id}/history`}
          passHref
          className="masonry-grid_item"
          css={{
            display: "block",
            textDecoration: "none",
            "&:hover": {
              textDecoration: "none",
              ".see-history": {
                textDecoration: "underline",
                color: "$primary11",
                transition: "color .3s",
              },
            },
          }}
        >
          <Stat
            label="Treasury Governance Participation"
            variant="interactive"
            tooltip={
              <Box>
                Number of proposals voted on relative to the number of proposals
                the orchestrator was eligible for while active.
              </Box>
            }
            value={
              govStats ? (
                <Flex css={{ alignItems: "baseline", gap: "$1" }}>
                  <Box css={{ color: "$hiContrast" }}>{govStats.voted}</Box>
                  <Box
                    css={{
                      fontSize: "$3",
                      color: "$neutral11",
                      fontWeight: 500,
                    }}
                  >
                    / {govStats.eligible} Proposals
                  </Box>
                </Flex>
              ) : (
                "N/A"
              )
            }
            meta={
              <Box css={{ width: "100%", marginTop: "$2" }}>
                {govStats && (
                  <Box
                    css={{
                      width: "100%",
                      height: 4,
                      backgroundColor: "$neutral4",
                      borderRadius: "$2",
                      overflow: "hidden",
                      marginBottom: "$2",
                    }}
                  >
                    <Box
                      css={{
                        width: `${govParticipation * 100}%`,
                        height: "100%",
                        backgroundColor: "$primary11",
                      }}
                    />
                  </Box>
                )}
                <Flex
                  css={{
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%",
                  }}
                >
                  {govStats && (
                    <Text
                      size="2"
                      css={{ color: "$neutral11", fontWeight: 600 }}
                    >
                      {numbro(govParticipation).format({
                        output: "percent",
                        mantissa: 0,
                      })}{" "}
                      Participation
                    </Text>
                  )}
                  <Text
                    className="see-history"
                    size="2"
                    css={{
                      color: "$primary11",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: "$0.75",
                    }}
                  >
                    See history
                    <Box as={ArrowTopRightIcon} width={15} height={15} />
                  </Text>
                </Flex>
              </Box>
            }
          />
        </A>
      </Masonry>
    </Box>
  );
};

export default Index;
