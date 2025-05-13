import { PollExtended } from "@lib/api/polls";
import { fromWei } from "@lib/utils";
import { AccountQuery, PollChoice } from "apollo";
import numeral from "numeral";
export type VotingResponse = {
  poll: PollExtended;
  delegateVote:
    | {
        __typename: "Vote";
        choiceID?: PollChoice;
        voteStake: string;
        nonVoteStake: string;
      }
    | undefined
    | null;
  vote:
    | {
        __typename: "Vote";
        choiceID?: PollChoice;
        voteStake: string;
        nonVoteStake: string;
      }
    | undefined
    | null;
  myAccount: AccountQuery;
};

export const formatPercent = (percent: number) => numeral(percent).format("0.0000%");


export function getVotingPower(
    accountAddress: string,
    myAccount: VotingResponse["myAccount"],
    vote: VotingResponse["vote"],
    pendingStake?: string
  ) {
    // if account is a delegate its voting power is its total stake minus its delegators' vote stake (nonVoteStake)
    if (accountAddress === myAccount?.delegator?.delegate?.id) {
      if (vote?.voteStake) {
        return +vote.voteStake - +vote?.nonVoteStake;
      }
      return (
        +myAccount?.delegator?.delegate?.totalStake -
        (vote?.nonVoteStake ? +vote?.nonVoteStake : 0)
      );
    }
  
    return fromWei(pendingStake ? pendingStake : "0");
  }

  