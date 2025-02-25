import { type Address } from 'viem';
import { ethers } from 'ethers';
import { inbox } from '@lib/api/abis/bridge/Inbox';

export const waitForTx = async (
  tx: ethers.TransactionResponse
): Promise<ethers.TransactionReceipt> => {
  const receipt = await tx.wait();
  if (!receipt) {
    throw new Error('Transaction failed: no receipt received');
  }
  return receipt;
};

export const waitToRelayTxsToL2 = async (
  l1TxReceipt: Promise<ethers.TransactionReceipt> | ethers.TransactionReceipt,
  inboxAddress: Address,
  l1Provider: ethers.Provider,
  l2Provider: ethers.Provider,
  maxWaitTimeMS = 900000 // 15 minutes
): Promise<ethers.TransactionReceipt> => {
  // Ensure we have a resolved receipt
  const resolvedReceipt = await Promise.resolve(l1TxReceipt);
  
  const inboxContract = new ethers.Contract(inboxAddress, inbox, l1Provider);
  
  // Get the MessageDelivered event
  const messageDeliveredEvents = await inboxContract.queryFilter(
    inboxContract.filters.InboxMessageDelivered(),
    resolvedReceipt.blockNumber,
    resolvedReceipt.blockNumber
  );

  if (!messageDeliveredEvents.length) {
    throw new Error('No MessageDelivered event found');
  }

  const event = messageDeliveredEvents[0];
  // In ethers v6, we need to parse the event arguments
  const parsedLog = inboxContract.interface.parseLog({
    topics: event.topics ? [...event.topics] : [],
    data: event.data
  });

  if (!parsedLog?.args || !parsedLog.args[0]) {
    throw new Error('Message index not found in event');
  }

  const messageIndex = parsedLog.args[0];

  const startTime = Date.now();
  while (Date.now() - startTime < maxWaitTimeMS) {
    try {
      const l2Receipt = await l2Provider.getTransactionReceipt(
        ethers.hexlify(messageIndex)
      );
      if (l2Receipt) {
        return l2Receipt;
      }
    } catch (e) {
      // Ignore errors and continue polling
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  throw new Error('Timed out waiting for L2 transaction');
};
