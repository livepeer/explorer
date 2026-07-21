import { getCacheControlHeader } from "@lib/api";
import { bondingManager } from "@lib/api/abis/main/BondingManager";
import { getBondingManagerAddress } from "@lib/api/contracts";
import { badRequest, internalError, methodNotAllowed } from "@lib/api/errors";
import { UnbondingLocks } from "@lib/api/types/get-unbonding-locks";
import { l2PublicClient } from "@lib/chains";
import { NextApiRequest, NextApiResponse } from "next";
import { formatEther, isAddress } from "viem";

/** Lock ids read per request, so a caller cannot ask for an unbounded scan. */
const MAX_SCAN = 200;

/**
 * TEMPORARY stopgap, paired with the subgraph outage: returns the delegator's
 * unbonding locks from `from` onwards, so the UI can show locks created after
 * the subgraph stopped indexing. Everything the subgraph already knows keeps
 * coming from the subgraph.
 *
 * Remove this route along with its caller once indexing has recovered.
 */
const handler = async (
  req: NextApiRequest,
  res: NextApiResponse<UnbondingLocks | null>
) => {
  try {
    const method = req.method;

    if (method === "GET") {
      res.setHeader("Cache-Control", getCacheControlHeader("revalidate"));

      const { address, from } = req.query;

      if (!!address && !Array.isArray(address) && isAddress(address)) {
        const bondingManagerAddress = await getBondingManagerAddress();

        const contract = {
          address: bondingManagerAddress,
          abi: bondingManager,
        } as const;

        // [bondedAmount, fees, delegateAddress, delegatedAmount, startRound,
        //  lastClaimRound, nextUnbondingLockId]
        const delegator = await l2PublicClient.readContract({
          ...contract,
          functionName: "getDelegator",
          args: [address],
        });
        const delegateAddress = delegator[2];
        const end = Number(delegator[6]);

        // Ids are sequential and never reused, so anything the subgraph has not
        // seen sits above its highest known id. Always cover the newest ids,
        // whatever `from` asks for, and never read more than MAX_SCAN of them.
        const requested = Number(Array.isArray(from) ? from[0] : from);
        const start = Math.max(
          0,
          Number.isFinite(requested) ? requested : 0,
          end - MAX_SCAN
        );

        const results = await l2PublicClient.multicall({
          allowFailure: false,
          contracts: Array.from(
            { length: Math.max(0, end - start) },
            (_, i) => ({
              ...contract,
              functionName: "getDelegatorUnbondingLock" as const,
              args: [address, BigInt(start + i)] as const,
            })
          ),
        });

        // Withdrawing and rebonding both delete the lock, so a non-zero amount
        // is what makes one open.
        const locks = results
          .map(([amount, withdrawRound], i) => ({
            amount,
            withdrawRound,
            id: start + i,
          }))
          .filter(({ amount }) => amount > 0n)
          .map(({ amount, withdrawRound, id }) => ({
            id: `${address.toLowerCase()}-${id}`,
            unbondingLockId: id,
            amount: formatEther(amount),
            withdrawRound: withdrawRound.toString(),
            delegate: { id: delegateAddress.toLowerCase() },
          }));

        return res.status(200).json({ locks });
      } else {
        return badRequest(res, "Invalid address format");
      }
    }

    return methodNotAllowed(res, method ?? "unknown", ["GET"]);
  } catch (err) {
    return internalError(res, err);
  }
};

export default handler;
