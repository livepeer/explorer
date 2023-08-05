import { Proposal } from "./types/get-treasury-proposal";

// Mock data copied from contracts state. Pretend this comes from a subgraph
export const proposalsDb: Record<string, Omit<Proposal, "id">> = {
  "80868671682358525592970283161149876637195132395360535796076124805098949828778": {
    proposer: "0xa0e809148ca31352e09f91f465b81597b9862695",
    voteStart: 188508,
    voteEnd: 188518,
    description: "# Send 10 LPT to myself\nTest proposal to send some tokens to myself.",
  },
  "28111245201609602451043233048648272941858730432299186281846225387292981883167": {
    proposer: "0xa0e809148ca31352e09f91f465b81597b9862695",
    voteStart: 188508,
    voteEnd: 188518,
    description: "# Send 10LPT to myself (again)\nLet's try again now with longer round delays.",
  },
  "6822370621520126296462524078366590706393015498185306034972050845284155225347": {
    proposer: "0xa0e809148ca31352e09f91f465b81597b9862695",
    voteStart: 188523,
    voteEnd: 188533,
    description: "# Take the money back\nThis ship is wrecked, abort!",
  },
};
