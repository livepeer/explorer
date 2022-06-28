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
        orderBy: thirtyDayVolumeETH
        orderDirection: desc
      ) {
        id
        totalVolumeETH
        feeShare
        activationTimestamp
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
        identity {
          id
          name
          website
          twitter
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
        pools(first: 90, orderBy: id, orderDirection: desc, where: { round_not: "${currentRound}" }) {
          rewardTokens
        }
        thirtyDayVolumeETH
        sixtyDayVolumeETH
        ninetyDayVolumeETH
      }
      protocol(id: "0") {
        id
        totalSupply
        totalActiveStake
        inflation
        inflationChange
        roundLength
        lptPriceEth
        currentRound {
          id
        }
      }
    }
  `;
};
