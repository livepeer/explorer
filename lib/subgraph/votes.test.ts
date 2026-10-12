import { paginate, querySubgraph } from "./client";
import { fetchPollVotes } from "./votes";

jest.mock("./client", () => ({
  querySubgraph: jest.fn(),
  paginate: jest.fn(),
}));

const ORCH = "0x00000000000000000000000000000000000000aa";
const DELEGATOR = "0x00000000000000000000000000000000000000bb";

describe("fetchPollVotes", () => {
  it("takes self-voting delegators' stake off their orchestrator's weight", async () => {
    jest.mocked(paginate).mockImplementation(async (_query, key) =>
      key === "votes"
        ? [
            {
              id: "1",
              voter: ORCH,
              voteStake: "1000",
              nonVoteStake: "300",
              choiceID: "Yes",
              registeredTranscoder: true,
            },
            {
              id: "2",
              voter: DELEGATOR,
              voteStake: "300",
              nonVoteStake: "0",
              choiceID: "No",
              registeredTranscoder: false,
            },
          ]
        : []
    );
    jest.mocked(querySubgraph).mockResolvedValueOnce({
      delegators: [
        { id: ORCH, delegate: { id: ORCH } },
        { id: DELEGATOR, delegate: { id: ORCH } },
      ],
    });

    const votes = await fetchPollVotes("0xpoll");
    expect(votes.map((v) => [v.voter, v.choice, v.weight])).toEqual([
      [ORCH, "yes", 700],
      [DELEGATOR, "no", 300],
    ]);
  });
});
