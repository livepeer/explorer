/** A wallet or contract error, in a line people can read. */
export function errorText(e: unknown) {
  const full = e instanceof Error ? e.message : String(e);
  const msg =
    e instanceof Error
      ? (e as { shortMessage?: string }).shortMessage ?? e.message
      : String(e);
  if (/user rejected|denied/i.test(msg)) return "Request rejected in wallet";
  if (/ALREADY_SPENT/.test(full)) return "This withdrawal was already claimed.";
  // Used on both networks: the wallet's prompt says which one it's on.
  if (/insufficient funds/i.test(full)) {
    return "Not enough ETH on this network for the transaction's fee.";
  }
  return msg.split("\n")[0];
}
