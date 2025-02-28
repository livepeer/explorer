export const getAccountVotingHistory =(id:string) =>{
  
  return `{
  "measures": [
    "LivepeerProposalStatus.count",
    "LivepeerProposalStatus.votingTurnout",
    "LivepeerProposalStatus.proposalVotedOn"
  ],
  "order": {
    "LivepeerProposalStatus.count": "desc"
  },
  "dimensions": [
    "LivepeerProposalStatus.date",
    "LivepeerProposalStatus.round",
    "LivepeerProposalStatus.eventTxnHash",
    "LivepeerProposalStatus.nameOfProposal",
    "LivepeerProposalStatus.voteType",
    "LivepeerProposalStatus.status",
    "LivepeerProposalStatus.proposedBy",
    "LivepeerProposalStatus.voter"
  ],
  "filters": [
    {
      "member": "LivepeerProposalStatus.voter",
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