import QueueExecuteButton from "@components/QueueExecuteButton";
import TreasuryVotingReason from "@components/TreasuryVotingReason";
import { ProposalExtended } from "@lib/api/treasury";
import { ProposalVotingPower } from "@lib/api/types/get-treasury-proposal";
import dayjs from "@lib/dayjs";
import { abbreviateNumber, fromWei, shortenAddress } from "@lib/utils";
import { Box, Button, Flex, Link, Text } from "@livepeer/design-system";
import { InfoCircledIcon } from "@modulz/radix-icons";
import { useAccountAddress } from "hooks";
import numbro from "numbro";
import { useState } from "react";

import VoteButton from "../VoteButton";

type Props = {
  proposal: ProposalExtended;
  vote: ProposalVotingPower | undefined | null;
};

const formatPercent = (percent: number) =>
  numbro(percent).format({
    output: "percent",
		mantissa: 2,
  });

const formatLPT = (lpt: string | undefined) =>
  abbreviateNumber(fromWei(lpt ?? "0"), 4);

const zeroAddress = "0x0000000000000000000000000000000000000000";

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
	<Text
		css={{
			fontSize: "$1",
			fontWeight: 600,
			color: "$neutral10",
			textTransform: "uppercase",
			letterSpacing: "0.05em",
			marginBottom: "$2",
		}}
	>
		{children}
	</Text>
);

const TreasuryVotingWidget = ({ proposal, vote, ...props }: Props) => {
  const accountAddress = useAccountAddress();

  const [reason, setReason] = useState("");

	const hasVotingPower =
		!!vote && !!vote.self && parseFloat(vote.self.votes) > 0;
	const canVoteNow =
		proposal.state === "Active" && vote?.self?.hasVoted === false;
	const isIneligible = canVoteNow && !hasVotingPower;
	const hasDelegate =
		!!vote?.delegate &&
		vote.delegate.address.toLowerCase() !== zeroAddress;

	// Determine user vote status
	const getUserVoteStatus = () => {
		if (!vote?.self) return null;
		if (isIneligible) return "Ineligible";
		if (vote.self.hasVoted) return "Voted";
		return "Not voted";
	};

	const userVoteStatus = getUserVoteStatus();

  return (
		<Box css={{ width: "100%" }} {...props}>
			<Box
				css={{
					width: "100%",
					border: "1px solid $neutral4",
					borderRadius: "$4",
					backgroundColor: "$panel",
					padding: "$4",
				}}
			>
				{/* ========== RESULTS SECTION ========== */}
				<Box css={{ marginBottom: "$4" }}>
					<SectionLabel>Results</SectionLabel>

					{/* Vote bars - read-only styled */}
					<Box css={{ marginBottom: "$3" }}>
						{/* Against bar */}
						<Flex
							css={{
								alignItems: "center",
								justifyContent: "space-between",
								marginBottom: "$2",
							}}
						>
							<Text css={{ fontSize: "$2", color: "$neutral11", minWidth: 60 }}>
								Against
							</Text>
							<Flex
								css={{ flex: 1, marginLeft: "$3", marginRight: "$3", alignItems: "center" }}
							>
								<Box
									css={{
										height: 6,
										borderRadius: 3,
										backgroundColor: "$neutral5",
										width: "100%",
										overflow: "hidden",
									}}
								>
									<Box
										css={{
											height: "100%",
											borderRadius: 3,
											backgroundColor: "$neutral9",
											width: `${proposal.votes.percent.against * 100}%`,
										}}
									/>
                </Box>
							</Flex>
							<Text
								css={{
									fontSize: "$2",
									color: "$hiContrast",
									fontVariantNumeric: "tabular-nums",
									minWidth: 55,
									textAlign: "right",
								}}
							>
								{formatPercent(proposal.votes.percent.against)}
							</Text>
						</Flex>

						{/* For bar */}
						<Flex
							css={{
								alignItems: "center",
								justifyContent: "space-between",
								marginBottom: "$2",
							}}
						>
							<Text css={{ fontSize: "$2", color: "$neutral11", minWidth: 60 }}>
								For
							</Text>
							<Flex
								css={{ flex: 1, marginLeft: "$3", marginRight: "$3", alignItems: "center" }}
							>
								<Box
									css={{
										height: 6,
										borderRadius: 3,
										backgroundColor: "$neutral5",
										width: "100%",
										overflow: "hidden",
									}}
								>
									<Box
										css={{
											height: "100%",
											borderRadius: 3,
											backgroundColor: "$green9",
											width: `${proposal.votes.percent.for * 100}%`,
										}}
									/>
                </Box>
							</Flex>
							<Text
								css={{
									fontSize: "$2",
									color: "$hiContrast",
									fontVariantNumeric: "tabular-nums",
									minWidth: 55,
									textAlign: "right",
								}}
							>
								{formatPercent(proposal.votes.percent.for)}
							</Text>
						</Flex>

						{/* Abstain bar */}
						<Flex
							css={{
								alignItems: "center",
								justifyContent: "space-between",
							}}
						>
							<Text css={{ fontSize: "$2", color: "$neutral11", minWidth: 60 }}>
								Abstain
							</Text>
							<Flex
								css={{ flex: 1, marginLeft: "$3", marginRight: "$3", alignItems: "center" }}
							>
								<Box
									css={{
										height: 6,
										borderRadius: 3,
										backgroundColor: "$neutral5",
										width: "100%",
										overflow: "hidden",
									}}
								>
									<Box
										css={{
											height: "100%",
											borderRadius: 3,
											backgroundColor: "$neutral8",
											width: `${proposal.votes.percent.abstain * 100}%`,
										}}
									/>
                </Box>
							</Flex>
							<Text
								css={{
									fontSize: "$2",
									color: "$hiContrast",
									fontVariantNumeric: "tabular-nums",
									minWidth: 55,
									textAlign: "right",
								}}
							>
								{formatPercent(proposal.votes.percent.abstain)}
							</Text>
						</Flex>
					</Box>

					{/* Summary line */}
					<Text css={{ fontSize: "$2", color: "$neutral11" }}>
						{abbreviateNumber(proposal.votes.total.voters, 4)} LPT voted ·{" "}
						{proposal.state !== "Pending" && proposal.state !== "Active"
							? "Final Results"
							: dayjs.duration(proposal.votes.voteEndTime.diff()).humanize() +
							" left"}
					</Text>
				</Box>

				{/* ========== YOUR VOTE SECTION ========== */}
				{accountAddress ? (
					<Box
						css={{
							borderTop: "1px solid $neutral4",
							paddingTop: "$4",
						}}
					>
						<SectionLabel>Your vote</SectionLabel>

						{/* Delegate vote status */}
						{hasDelegate && (
							<Flex
								css={{
									fontSize: "$2",
									marginBottom: "$2",
									justifyContent: "space-between",
								}}
							>
								<Text css={{ color: "$neutral11" }}>
									Delegate vote ({shortenAddress(vote.delegate!.address)})
								</Text>
								<Text css={{ fontWeight: 500, color: "$hiContrast" }}>
									{vote.delegate!.hasVoted ? "Voted" : "Not voted"}
								</Text>
							</Flex>
						)}

						{/* User vote status */}
						<Flex
							css={{
								fontSize: "$2",
								marginBottom: "$2",
								justifyContent: "space-between",
							}}
						>
							<Text css={{ color: "$neutral11" }}>Status</Text>
							<Text
								css={{
									fontWeight: 500,
									color: isIneligible ? "$neutral11" : "$hiContrast",
								}}
							>
								{userVoteStatus}
							</Text>
						</Flex>

						{/* Voting power */}
						<Flex
							css={{
								fontSize: "$2",
								justifyContent: "space-between",
							}}
						>
							<Text css={{ color: "$neutral11" }}>Voting power</Text>
							<Text
								css={{
									fontWeight: 500,
									color: isIneligible ? "$neutral11" : "$hiContrast",
									fontVariantNumeric: "tabular-nums",
								}}
							>
								{vote?.self ? formatLPT(vote.self.votes) : "0"} LPT
							</Text>
						</Flex>

						{/* ========== ACTION AREA ========== */}

						{/* Eligible: show vote buttons + reason */}
						{canVoteNow && hasVotingPower && (
							<Box
								css={{
									marginTop: "$4",
									display: "grid",
									gap: "$2",
									gridTemplateColumns: "1fr 1fr",
								}}
							>
								<VoteButton
									variant="red"
									size="4"
									choiceId={0}
									proposalId={proposal?.id}
									reason={reason}
								>
									Against
								</VoteButton>
								<VoteButton
									variant="primary"
									choiceId={1}
									size="4"
									proposalId={proposal?.id}
									reason={reason}
								>
									For
								</VoteButton>
								<VoteButton
									variant="gray"
									size="4"
									choiceId={2}
									proposalId={proposal?.id}
									reason={reason}
									css={{ gridColumn: "span 2" }}
								>
									Abstain
								</VoteButton>

								<Box css={{ gridColumn: "span 2" }}>
									<TreasuryVotingReason reason={reason} setReason={setReason} />
								</Box>
							</Box>
						)}

						{/* Ineligible: show info banner + links, no buttons, no reason */}
						{isIneligible && (
							<Box
								css={{
									marginTop: "$4",
									padding: "$3",
									borderRadius: "$3",
									backgroundColor: "$neutral3",
									border: "1px solid $neutral5",
								}}
							>
								<Flex css={{ alignItems: "flex-start", gap: "$2" }}>
									<Box
										as={InfoCircledIcon}
										css={{
											color: "$neutral11",
											flexShrink: 0,
											width: 16,
											height: 16,
											marginTop: 1,
										}}
									/>
									<Box>
										<Text
											css={{
												fontSize: "$2",
												fontWeight: 600,
												color: "$hiContrast",
												marginBottom: "$1",
											}}
										>
											Ineligible to vote
										</Text>
										<Text
											css={{
												fontSize: "$2",
												color: "$neutral11",
												marginBottom: "$3",
											}}
										>
											You had 0 LPT staked on{" "}
											{proposal.votes.voteStartTime.format("MMM D, YYYY")} when
											this proposal was created.
										</Text>
										<Flex css={{ gap: "$3" }}>
											<Link
												href="https://github.com/livepeer/LIPs/blob/master/LIPs/LIP-89.md#governance-over-the-treasury"
												target="_blank"
												css={{
													fontSize: "$2",
													color: "$primary11",
													textDecoration: "none",
													"&:hover": { textDecoration: "underline" },
												}}
											>
												Learn about stake snapshots
											</Link>
										</Flex>
									</Box>
								</Flex>
							</Box>
						)}

						{/* Queue/Execute buttons for passed proposals */}
						{["Succeeded", "Queued"].includes(proposal?.state) && (
							<Box
								css={{
									marginTop: "$4",
								}}
							>
								<QueueExecuteButton
									variant="primary"
									size="4"
									action={proposal.state === "Queued" ? "execute" : "queue"}
									proposal={proposal}
									css={{ width: "100%" }}
								/>
							</Box>
						)}
					</Box>
				) : (
						/* No wallet connected */
						<Box
							css={{
								borderTop: "1px solid $neutral4",
								paddingTop: "$4",
							}}
						>
							<SectionLabel>Your vote</SectionLabel>
            <Flex align="center" direction="column">
              <Button
                size="4"
                disabled={true}
                variant="primary"
                css={{ width: "100%" }}
              >
                Vote
              </Button>
              <Text
                size="2"
									css={{ marginTop: "$2", color: "$neutral11" }}
              >
                Connect your wallet to vote.
              </Text>
							</Flex>
						</Box>
				)}
      </Box>
    </Box>
  );
};

export default TreasuryVotingWidget;
