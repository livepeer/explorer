import Stat from "@components/Stat";
import dayjs from "@lib/dayjs";
import { Box, Flex, Link as A, Text } from "@livepeer/design-system";
import { ArrowTopRightIcon, CheckIcon, Cross1Icon } from "@modulz/radix-icons";
import {
  formatETH,
  formatNumber,
  formatPercent,
  formatStakeAmount,
} from "@utils/numberFormatters";
import { PERCENTAGE_PRECISION_MILLION } from "@utils/web3";
import {
  AccountQueryResult,
  OrderDirection,
  TranscoderActivatedEvent_OrderBy,
  useTranscoderActivatedEventsQuery,
  useTreasuryProposalsQuery,
  useTreasuryVotesQuery,
} from "apollo";
import { useScoreData } from "hooks";
import { useRegionsData } from "hooks/useSwr";
import Link from "next/link";
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

const Index = ({ currentRound, transcoder, isActive }: Props) => {
  const callsMade = useMemo(
    () => transcoder?.pools?.filter((r) => r.rewardTokens != null)?.length ?? 0,
    [transcoder?.pools]
  );

  const scores = useScoreData(transcoder?.id);
  const knownRegions = useRegionsData();

  const { data: firstTranscoderActivatedEventsData } =
    useTranscoderActivatedEventsQuery({
      variables: {
        where: {
          delegate: transcoder?.id,
        },
        first: 1,
        orderBy: TranscoderActivatedEvent_OrderBy.ActivationRound,
        orderDirection: OrderDirection.Asc,
      },
    });

  const firstActivationRound = useMemo(() => {
    return firstTranscoderActivatedEventsData?.transcoderActivatedEvents[0]
      ?.activationRound;
  }, [firstTranscoderActivatedEventsData]);

  const { data: treasuryVotesData } = useTreasuryVotesQuery({
    variables: {
      where: {
        voter: transcoder?.id,
      },
    },
  });

  const { data: eligebleProposalsData } = useTreasuryProposalsQuery({
    variables: {
      where: {
        voteStart_gt: firstActivationRound,
      },
    },
    skip: !firstActivationRound,
  });

  const govStats = useMemo(() => {
    if (!treasuryVotesData || !eligebleProposalsData) return null;
    return {
      voted: treasuryVotesData?.treasuryVotes.length ?? 0,
      eligible: eligebleProposalsData?.treasuryProposals.length ?? 0,
    };
  }, [treasuryVotesData, eligebleProposalsData]);

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
      ? `${formatPercent(maxScore.transcoding?.score)} - ${
          maxScore.transcoding.region
        }`
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
        {formatPercent(maxScore.ai?.value)} - {region}
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
          value={transcoder ? formatStakeAmount(transcoder?.totalStake) : "N/A"}
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
          value={formatETH(transcoder?.totalVolumeETH)}
        />
        <Stat
          className="masonry-grid_item"
          label="Price / Pixel"
          tooltip="The most recent price for transcoding which the orchestrator is currently advertising off-chain to gateways. This may be different from on-chain pricing."
          value={scores ? `${formatNumber(scores.pricePerPixel)} WEI` : "N/A"}
        />
        {/* <Stat
          className="masonry-grid_item"
          label="Total Delegators"
          tooltip={
            "The number of delegators which have delegated stake to this orchestrator."
          }
          value={`${formatNumber(transcoder?.delegators?.length, {
            precision: 0,
          })}`}
        /> */}
        <Stat
          className="masonry-grid_item"
          label="Fee Cut"
          tooltip={
            "The percent of the transcoding fees which are kept by the orchestrator, with the remainder distributed to its delegators by percent stake."
          }
          value={
            transcoder?.feeShare
              ? formatPercent(
                  1 -
                    +(transcoder?.feeShare || 0) / PERCENTAGE_PRECISION_MILLION
                )
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
              ? formatPercent(+(transcoder?.rewardCut || 0) / 1000000)
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
                    / {formatNumber(govStats.eligible, { precision: 0 })} Proposals
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
                        width: `${(govStats.voted / govStats.eligible) * 100}%`,
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
                      {formatPercent(govStats.voted / govStats.eligible, {
                        precision: 0,
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
