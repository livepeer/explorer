// LPT token addresses used to pre-fill external acquisition flows.
const ARBITRUM_LPT_ADDRESS = "0x289ba1701c2f088cf0faf8b3705246331cb8a839";
const ETHEREUM_LPT_ADDRESS = "0x58b6a8a3302369daec383334672404ee733ab239";

// Swap ETH -> LPT on Arbitrum via the DefiLlama aggregator.
export const GET_LPT_URL = `https://swap.defillama.com/?chain=arbitrum&from=0x0000000000000000000000000000000000000000&to=${ARBITRUM_LPT_ADDRESS}`;

// Bridge LPT from Ethereum to Arbitrum One via the Arbitrum bridge portal.
export const BRIDGE_LPT_URL = `https://portal.arbitrum.io/bridge?destinationChain=arbitrum-one&sourceChain=ethereum&token=${ETHEREUM_LPT_ADDRESS}&destinationToken=${ETHEREUM_LPT_ADDRESS}`;
