import IPFS from "ipfs-mini";

const ipfs = new IPFS({
  host: "ipfs.infura.io",
  port: 5001,
  protocol: "https",
});

export const addIpfs = async (content: object): Promise<string> => {
  return ipfs.addJSON({
    ...content,
  });
};

export type IpfsPoll = { gitCommitHash: string; text: string };

export const catIpfsJson = async <T>(
  ipfsHash: string | undefined | null
): Promise<T | null> => {
  if (ipfsHash) {
    const fetchResult = await fetch(
      `https://ipfs.infura.io:5001/api/v0/cat?arg=${ipfsHash}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // TODO(chase): add auth here for higher rate limiting
          // https://docs.infura.io/infura/networks/ipfs/how-to/request-rate-limits
        },
      }
    );
    const result = await fetchResult.json();

    return result as T;
  }

  return null;
};
