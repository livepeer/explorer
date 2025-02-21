export const getAccountVotingHistory =(id:string) =>{
  
  return `{
  "measures": [
    "LivepeerVoteType.count",
    "LivepeerVoteType.votingTurnout"
  ],
  "order": {
    "LivepeerVoteType.count": "desc"
  },
  "dimensions": [
    "LivepeerVoteType.date",
    "LivepeerVoteType.voter",
    "LivepeerVoteType.nameOfProposal",
    "LivepeerVoteType.voteType",
    "LivepeerVoteType.round"
  ],
  "filters": [
    {
      "member": "LivepeerVoteType.voter",
      "operator": "equals",
      "values": [
        "${id}"
      ]
    }
  ]
}`}


export const getOrchestratorsVotingHistory=()=>{
  return `{
  "measures": [
    "LivepeerVoteProposals.count",
    "LivepeerVoteProposals.numOfProposals",
    "LivepeerVoteProposals.numOfVoteCasted"
  ],
  "order": {
    "LivepeerVoteProposals.count": "desc"
  },
  "dimensions": [
    "LivepeerVoteProposals.date",
    "LivepeerVoteProposals.voter",
    "LivepeerVoteProposals.eventTxnsHash",
    "LivepeerVoteProposals.voteType"
  ]
}`
}