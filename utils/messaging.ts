import { ethers } from "ethers";
import InboxABI from "./Inbox.json";

export async function waitForTx(
  tx: ethers.ContractTransactionResponse | Promise<ethers.ContractTransactionResponse>,
  _confirmations?: number
): Promise<ethers.ContractTransactionReceipt> {
  const resolvedTx = await tx;
  const confirmations =
    _confirmations ??
    chainIdToConfirmationsNeededForFinalization(Number(resolvedTx.chainId));

  // we retry / wait if it fails the first time
  try {
    const receipt = await resolvedTx.wait(confirmations);
    if (!receipt) throw new Error('No receipt');
    return receipt;
  } catch (e) {}
  const receipt = await resolvedTx.wait(confirmations);
  if (!receipt) throw new Error('No receipt');
  return receipt;
}

function chainIdToConfirmationsNeededForFinalization(chainId: number): number {
  const defaultWhenReorgsPossible = 3;
  const defaultForInstantFinality = 0;

  // covers mainnet and public testnets
  if (chainId < 6) {
    return defaultWhenReorgsPossible;
  } else {
    return defaultForInstantFinality;
  }
}

export async function waitToRelayTxsToL2(
  inProgressL1Tx: Promise<ethers.ContractTransactionReceipt>,
  inboxAddress: string,
  l1: ethers.Provider,
  l2: ethers.Provider
) {
  const l1Tx = await inProgressL1Tx;
  const seqNums = await getInboxSeqNumFromContractTransaction(
    l1Tx,
    inboxAddress,
    l1
  );
  const seqNum = seqNums && seqNums[0];
  if (!seqNum) {
    throw new Error("Seq num not found");
  }
  const retryableTicket = await calculateL2TransactionHash(seqNum, l2);
  const retryableTicketHex = ethers.toBeHex(retryableTicket);
  const autoRedeem = calculateRetryableAutoRedeemTxnHash(retryableTicketHex);
  const redeemTransaction = calculateL2RetryableTransactionHash(retryableTicketHex);

  console.log("autoRedeem", autoRedeem);

  console.log(
    // eslint-disable-next-line
    `Waiting for xchain messages to be relayed... L1 hash: ${l1Tx.hash}, L2 tx hash: ${retryableTicket}, L2 auto redeem tx: ${redeemTransaction}`
  );

  const retryableTicketReceipt = await l2.waitForTransaction(
    retryableTicket,
    undefined,
    1000 * 60 * 15
  );
  console.log(retryableTicketReceipt);

  //   expect(retryableTicketReceipt.status).to.equal(1);

  const autoRedeemReceipt = await l2.waitForTransaction(
    autoRedeem,
    undefined,
    1000 * 60
  );
  console.log(autoRedeemReceipt);

  //   expect(autoRedeemReceipt.status).to.equal(1);

  const redemptionReceipt = await l2.getTransactionReceipt(redeemTransaction);
  console.log(redemptionReceipt);

  //   expect(redemptionReceipt.status).equals(1);
  console.log("Xchain message arrived");

  return redemptionReceipt;
}

async function getInboxSeqNumFromContractTransaction(
  l1Transaction: ethers.ContractTransactionReceipt,
  inboxAddress: string,
  provider: ethers.Provider
) {
  const contract = new ethers.Contract(inboxAddress, InboxABI, provider);
  const iface = contract.interface;
  const messageDelivered = iface.getEvent("InboxMessageDelivered") ?? 
    iface.getEvent("event InboxMessageDelivered");
  const messageDeliveredFromOrigin = iface.getEvent("InboxMessageDeliveredFromOrigin") ?? 
    iface.getEvent("event InboxMessageDeliveredFromOrigin");
  
  if (!messageDelivered || !messageDeliveredFromOrigin) {
    throw new Error("Required events not found in interface");
  }

  const eventTopics = {
    InboxMessageDelivered: ethers.id(messageDelivered.format()),
    InboxMessageDeliveredFromOrigin: ethers.id(
      messageDeliveredFromOrigin.format()
    ),
  };

  const logs = l1Transaction.logs.filter(
    (log) =>
      log.topics[0] === eventTopics.InboxMessageDelivered ||
      log.topics[0] === eventTopics.InboxMessageDeliveredFromOrigin
  );

  if (logs.length === 0) return undefined;
  return logs.map((log) => BigInt(log.topics[1]));
}

async function calculateL2TransactionHash(
  inboxSequenceNumber: bigint,
  provider: ethers.Provider
) {
  const l2ChainId = BigInt((await provider.getNetwork()).chainId);

  return ethers.keccak256(
    ethers.concat([
      ethers.zeroPadValue(ethers.toBeHex(l2ChainId), 32),
      ethers.zeroPadValue(ethers.toBeHex(bitFlipSeqNum(inboxSequenceNumber)), 32),
    ])
  );
}

function bitFlipSeqNum(seqNum: bigint) {
  return seqNum | (BigInt(1) << BigInt(255));
}

function calculateRetryableAutoRedeemTxnHash(requestID: string) {
  return ethers.keccak256(
    ethers.concat([
      ethers.zeroPadValue(requestID, 32),
      ethers.zeroPadValue(ethers.toBeHex(BigInt(1)), 32),
    ])
  );
}

function calculateL2RetryableTransactionHash(requestID: string) {
  return ethers.keccak256(
    ethers.concat([
      ethers.zeroPadValue(requestID, 32),
      ethers.zeroPadValue(ethers.toBeHex(BigInt(0)), 32),
    ])
  );
}
