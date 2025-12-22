export const formatAddress = (addr: string): string => {
  if (!addr) return "";
  if (addr.endsWith(".xyz")) {
    return addr.length > 21 ? `${addr.slice(0, 6)}...${addr.slice(-6)}` : addr;
  }
  if (addr.endsWith(".eth") && addr.length < 21) {
    return addr;
  }
  return addr.length > 21 ? `${addr.slice(0, 6)}...${addr.slice(-6)}` : addr;
};
