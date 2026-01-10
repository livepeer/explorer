import { AddIpfs } from "@lib/api/types/add-ipfs";

export const addIpfs = async (content: object): Promise<string> => {
  const fetchResult = await fetch(`/api/upload-ipfs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(content),
  });

  if (!fetchResult.ok) {
    const error = await fetchResult.json().catch(() => null);
    throw new Error(error?.error || "Failed to upload to IPFS");
  }

  const result = (await fetchResult.json()) as AddIpfs;
  return result.hash;
};

export type IpfsPoll = { gitCommitHash: string; text: string };

export const catIpfsJson = async <T>(
  ipfsHash: string | undefined | null
): Promise<T | null> => {
  if (ipfsHash) {
    const fetchResult = await fetch(
      `https://ipfs.livepeer.com/ipfs/${ipfsHash}`,
      {
        method: "GET",
      }
    );
    const result = await fetchResult.json();

    return result as T;
  }

  return null;
};
