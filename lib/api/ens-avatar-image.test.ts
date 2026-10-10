/** @jest-environment node */

import { l1PublicClient } from "@lib/chains";
import { NextApiRequest, NextApiResponse } from "next";

import handler from "../../pages/api/ens-data/image/[name]";

jest.mock("@lib/chains", () => ({
  l1PublicClient: {
    getEnsAvatar: jest.fn().mockResolvedValue("http://127.0.0.1/private"),
  },
}));

const originalFetch = global.fetch;
const fetchMock = jest.fn() as jest.MockedFunction<typeof fetch>;

const request = (name: string | string[] | undefined) =>
  ({ method: "GET", query: { name } } as unknown as NextApiRequest);

const response = () => {
  const res = {
    setHeader: jest.fn(),
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
    end: jest.fn(),
  };
  return res as typeof res & NextApiResponse;
};

describe("ENS avatar image API", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock;
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it("requests only the ENS metadata host, even for an owner-set internal avatar URL", async () => {
    const image = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
    fetchMock.mockResolvedValue(
      new Response(image, { headers: { "content-type": "image/png" } })
    );
    const res = response();

    await handler(request("alice.eth"), res);

    expect(l1PublicClient.getEnsAvatar).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url.toString()).toBe(
      "https://metadata.ens.domains/mainnet/avatar/alice.eth"
    );
    expect(options).toEqual(
      expect.objectContaining({
        redirect: "error",
        signal: expect.any(AbortSignal),
      })
    );
    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "image/png");
    expect(res.end).toHaveBeenCalledWith(image);
  });

  it.each([undefined, "", ["alice.eth"], "salty-minning.eth"])(
    "rejects invalid or blacklisted ENS input %j before fetching",
    async (name) => {
      const res = response();
      await handler(request(name), res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(fetchMock).not.toHaveBeenCalled();
    }
  );

  it("rejects non-image responses", async () => {
    fetchMock.mockResolvedValue(
      new Response("not an image", {
        headers: { "content-type": "text/html" },
      })
    );
    const res = response();

    await handler(request("alice.eth"), res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.end).not.toHaveBeenCalled();
  });

  it("rejects image bodies that exceed the byte limit", async () => {
    fetchMock.mockResolvedValue(
      new Response(new Uint8Array(5 * 1024 * 1024 + 1), {
        headers: { "content-type": "image/png" },
      })
    );
    const res = response();

    await handler(request("alice.eth"), res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.end).not.toHaveBeenCalled();
  });
});
