import { gql } from "@apollo/client";

export const orchestratorsQuery = (currentRound) => {
  return gql`
    query transcoders(
      $where: Transcoder_filter
      $first: Int
      $skip: Int
      $orderBy: Transcoder_orderBy
      $orderDirection: OrderDirection
    ) {
      transcoders(
        where: {
          activationRound_lte: ${currentRound},
          deactivationRound_gt: ${currentRound},
        }
        first: $first
        skip: $skip
        orderBy: totalVolumeETH
        orderDirection: desc
      ) {
        id
        totalVolumeETH
        feeShare
        activationRound
        deactivationRound
        rewardCut
        totalStake
        price
        scores {
          global
          mdw
          fra
          sin
          nyc
          lax
          lon
          prg
        }
        successRates {
          global
          mdw
          fra
          sin
          nyc
          lax
          lon
          prg
        }
        roundTripScores {
          global
          mdw
          fra
          sin
          nyc
          lax
          lon
          prg
        }
        ens {
          name
          url
          avatar
          description
        }
        threeBoxSpace {
          __typename
          id
          did
          name
          website
          description
          image
        }
        delegator {
          startRound
          bondedAmount
          unbondingLocks {
            withdrawRound
          }
        }
        delegators(first: 1000) {
          id
        }
        pools(first: 30, orderBy: id, orderDirection: desc, where: { round_not: "${currentRound}" }) {
          rewardTokens
        }
      }
      protocol(id: "0") {
        id
        totalSupply
        totalActiveStake
        inflation
        inflationChange
        currentRound {
          id
        }
      }
    }
  `;
};
