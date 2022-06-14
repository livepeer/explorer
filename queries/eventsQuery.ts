import { gql } from "@apollo/client";

export const eventsQuery = gql`
  query events($first: Int) {
    transactions(first: $first, orderBy: timestamp, orderDirection: desc) {
      events {
        __typename
        round {
          id
        }
        transaction {
          id
          timestamp
          from
        }
        ... on BondEvent {
          delegator {
            id
          }
          newDelegate {
            id
          }
          oldDelegate {
            id
          }
          additionalAmount
        }
        ... on UnbondEvent {
          delegate {
            id
          }
          delegator {
            id
          }
          amount
        }
        ... on RebondEvent {
          delegate {
            id
          }
          delegator {
            id
          }
          amount
        }
        ... on TranscoderUpdateEvent {
          delegate {
            id
          }
          rewardCut
          feeShare
        }
        ... on RewardEvent {
          delegate {
            id
          }
          rewardTokens
        }
        ... on WithdrawStakeEvent {
          delegator {
            id
          }
          amount
        }
        ... on WithdrawFeesEvent {
          delegator {
            id
          }
          amount
        }
        ... on WinningTicketRedeemedEvent {
          recipient {
            id
          }
          faceValue
        }
        ... on DepositFundedEvent {
          sender {
            id
          }
          amount
        }
        ... on ReserveFundedEvent {
          reserveHolder {
            id
          }
          amount
        }
        ... on TransferBondEvent {
          amount
          newDelegator {
            id
          }
          oldDelegator {
            id
          }
        }
        ... on TranscoderActivatedEvent {
          activationRound
          delegate {
            id
          }
        }
        ... on TranscoderDeactivatedEvent {
          deactivationRound
          delegate {
            id
          }
        }
        # ... on EarningsClaimedEvent {
        #   rewardTokens
        #   fees
        #   delegate {
        #     id
        #   }
        # }
        # ... on TranscoderSlashedEvent {
        # TODO: implement when Slashed is used
        # }
        ... on TranscoderResignedEvent {
          delegate {
            id
          }
        }
        ... on TranscoderEvictedEvent {
          delegate {
            id
          }
        }
        ... on NewRoundEvent {
          transaction {
            from
          }
        }
        # ... on ReserveClaimedEvent {
        # TODO implement
        # }
        ... on WithdrawalEvent {
          sender {
            id
          }
          deposit
          reserve
        }
        ... on SetCurrentRewardTokensEvent {
          currentInflation
          currentMintableTokens
        }
        # ... on PauseEvent {
        # }
        # ... on UnpauseEvent {
        # }
        ... on ParameterUpdateEvent {
          param
        }
        ... on VoteEvent {
          voter
          choiceID
          poll {
            id
          }
        }
        ... on PollCreatedEvent {
          poll {
            id
          }
          endBlock
        }
        ... on ServiceURIUpdateEvent {
          addr
          serviceURI
        }
        # ... on MintEvent {
        #   amount
        #   to
        # }
        # ... on BurnEvent {
        #   value
        # }
        ... on MigrateDelegatorFinalizedEvent {
          l1Addr
          l2Addr
          stake
          delegatedStake
          fees
          # delegate
        }
        ... on StakeClaimedEvent {
          # delegator
          # delegate
          stake
          fees
        }
      }
    }
    transcoders(where: { active: true }) {
      id
      identity {
        id
        name
        image
      }
    }
  }
`;
