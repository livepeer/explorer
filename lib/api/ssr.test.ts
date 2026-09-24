import { ApolloClient, NormalizedCacheObject } from "@apollo/client";

import { CurrentRoundDocument, OrchestratorsDocument } from "../../apollo";
import { getOrchestrators } from "./ssr";

const mockClient = (query: jest.Mock) =>
  ({ query } as unknown as ApolloClient<NormalizedCacheObject>);

describe("getOrchestrators", () => {
  it("refuses to query orchestrators when the subgraph returns no current round", async () => {
    const query = jest.fn().mockResolvedValueOnce({
      data: { protocol: null },
    });

    await expect(getOrchestrators(mockClient(query))).rejects.toThrow(
      /no current round/i
    );

    // Only the current-round query may run; the orchestrators query must never
    // reach the gateway with a null activationRound filter.
    expect(query).toHaveBeenCalledTimes(1);
    expect(query).toHaveBeenCalledWith(
      expect.objectContaining({ query: CurrentRoundDocument })
    );
  });

  it("queries orchestrators with the resolved round", async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce({
        data: { protocol: { currentRound: { id: "123" } } },
      })
      .mockResolvedValueOnce({
        data: { transcoders: [] },
      });

    const result = await getOrchestrators(mockClient(query));

    expect(query).toHaveBeenCalledTimes(2);
    expect(query).toHaveBeenLastCalledWith(
      expect.objectContaining({
        query: OrchestratorsDocument,
        variables: { currentRound: "123", currentRoundString: "123" },
      })
    );
    expect(result.orchestrators.data).toEqual({ transcoders: [] });
  });
});
