import { gql } from "@apollo/client";

export const accountQuery = (currentRound) => {
  return gql`
    query accountQuery($account: ID!) {
      delegator(id: $account) {
        id
        pendingStake
        bondedAmount
        principal
        unbonded
        pendingFees
        withdrawnFees
        startRound
        lastClaimRound {
          id
        }
        unbondingLocks {
          id
          amount
          unbondingLockId
          withdrawRound
          delegate {
            id
          }
        }
        delegate(id: $account) {
          id
          active
          status
          totalStake
          identity {
            id
            name
            website
            twitter
            description
            image
          }
        }
      }
      transcoder(id: $account) {
        id
        active
        feeShare
        rewardCut
        price
        status
        active
        totalStake
        totalVolumeETH
        activationTimestamp
        activationRound
        deactivationRound
        thirtyDayVolumeETH
        lastRewardRound {
          id
        }
        pools(first: 30, orderBy: id, orderDirection: desc where: { round_not: "${currentRound}" }) {
          rewardTokens
        }
        delegators(first: 1000) {
          id
        }
        successRates {
          global
        }
        scores {
          global
        }
        roundTripScores {
          global
        }
      }
      account(id: $account) {
        id
        tokenBalance
        ethBalance
        allowance
        identity {
          id
          name
          website
          twitter
          description
          image
        }
      }
      protocol(id: "0") {
        id
        totalSupply
        totalActiveStake
        participationRate
        inflation
        inflationChange
        lptPriceEth
        yearlyRewardsToStakeRatio
        currentRound {
          id
        }
      }
    }
  `;
};
