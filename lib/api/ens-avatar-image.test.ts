/** @jest-environment node */

import { l1PublicClient } from "@lib/chains";
import { NextApiRequest, NextApiResponse } from "next";
import sharp from "sharp";

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

  it.each([
    undefined,
    "",
    ["alice.eth"],
    "salty-minning.eth",
    "Salty-Minning.eth",
    "has space.eth",
  ])(
    "rejects invalid or blacklisted ENS input %j before fetching",
    async (name) => {
      const res = response();
      await handler(request(name), res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(fetchMock).not.toHaveBeenCalled();
    }
  );

  it("serves large raster avatars as 160px WebP", async () => {
    const image = await sharp({
      create: {
        width: 704,
        height: 704,
        channels: 3,
        background: "#000",
        noise: { type: "gaussian", mean: 128, sigma: 30 },
      },
    })
      .png()
      .toBuffer();
    fetchMock.mockResolvedValue(
      new Response(image, { headers: { "content-type": "image/png" } })
    );
    const res = response();

    await handler(request("alice.eth"), res);

    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "image/webp");
    expect(res.setHeader).toHaveBeenCalledWith(
      "Content-Security-Policy",
      "default-src 'none'; sandbox"
    );
    const body: Buffer = res.end.mock.calls[0][0];
    expect(body.length).toBeLessThan(image.length);
    const metadata = await sharp(body).metadata();
    expect(metadata).toEqual(
      expect.objectContaining({ format: "webp", width: 160, height: 160 })
    );
  });

  it("keeps animated avatars animated", async () => {
    const frames = await Promise.all(
      ["#f00", "#0f0", "#00f"].map((background) =>
        sharp({ create: { width: 400, height: 400, channels: 3, background } })
          .png()
          .toBuffer()
      )
    );
    const image = await sharp(frames, { join: { animated: true } })
      .gif()
      .toBuffer();
    fetchMock.mockResolvedValue(
      new Response(image, { headers: { "content-type": "image/gif" } })
    );
    const res = response();

    await handler(request("alice.eth"), res);

    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "image/webp");
    const metadata = await sharp(res.end.mock.calls[0][0], {
      animated: true,
    }).metadata();
    expect(metadata).toEqual(
      expect.objectContaining({
        format: "webp",
        width: 160,
        pageHeight: 160,
        pages: 3,
      })
    );
  });

  it("serves SVG avatars unchanged", async () => {
    const image = Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><rect width="24" height="24"/></svg>'
    );
    fetchMock.mockResolvedValue(
      new Response(image, { headers: { "content-type": "image/svg+xml" } })
    );
    const res = response();

    await handler(request("alice.eth"), res);

    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "image/svg+xml");
    expect(res.end).toHaveBeenCalledWith(image);
  });

  it("applies EXIF orientation before re-encoding", async () => {
    // Stored as 400x200, left half red and right half blue. Orientation 6
    // displays it rotated 90° clockwise: red on top, blue at the bottom.
    const red = await sharp({
      create: { width: 200, height: 200, channels: 3, background: "#f00" },
    })
      .png()
      .toBuffer();
    const image = await sharp({
      create: { width: 400, height: 200, channels: 3, background: "#00f" },
    })
      .composite([{ input: red, left: 0, top: 0 }])
      .jpeg()
      .withMetadata({ orientation: 6 })
      .toBuffer();
    fetchMock.mockResolvedValue(
      new Response(image, { headers: { "content-type": "image/jpeg" } })
    );
    const res = response();

    await handler(request("alice.eth"), res);

    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "image/webp");
    const { data, info } = await sharp(res.end.mock.calls[0][0])
      .raw()
      .toBuffer({ resolveWithObject: true });
    const pixel = (x: number, y: number) => {
      const i = (y * info.width + x) * info.channels;
      return { r: data[i], b: data[i + 2] };
    };
    const top = pixel(80, 5);
    const bottom = pixel(80, info.height - 5);
    expect(top.r).toBeGreaterThan(200);
    expect(top.b).toBeLessThan(50);
    expect(bottom.b).toBeGreaterThan(200);
    expect(bottom.r).toBeLessThan(50);
  });

  it("serves images over the pixel limit unchanged", async () => {
    const image = await sharp({
      create: { width: 4200, height: 4200, channels: 3, background: "#888" },
    })
      .png()
      .toBuffer();
    fetchMock.mockResolvedValue(
      new Response(image, { headers: { "content-type": "image/png" } })
    );
    const res = response();

    await handler(request("alice.eth"), res);

    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "image/png");
    expect(res.end).toHaveBeenCalledWith(image);
  });

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
