import {
  ConnectButton as ConnectButtonRainbowKit,
  useChainModal,
} from "@rainbow-me/rainbowkit";
import { ConnectButtonProps } from "@rainbow-me/rainbowkit/dist/components/ConnectButton/ConnectButton";
import { DEFAULT_CHAIN_ID, L1_CHAIN_ID } from "lib/chains";
import { useRouter } from "next/router";
import { useWindowSize } from "react-use";
import { useAccount } from "wagmi";

const ConnectButton = (props: ConnectButtonProps) => {
  const { width } = useWindowSize();
  const { pathname } = useRouter();
  const { chain, status } = useAccount();
  const { openChainModal } = useChainModal();
  const expectedChainId = pathname.startsWith("/migrate")
    ? L1_CHAIN_ID
    : DEFAULT_CHAIN_ID;
  const isWrongRouteChain =
    status === "connected" && chain?.id && chain.id !== expectedChainId;

  if (isWrongRouteChain) {
    return (
      <button
        type="button"
        onClick={openChainModal}
        style={{
          alignItems: "center",
          backgroundColor: "#5D181D",
          border: 0,
          borderRadius: 8,
          color: "#FF6B70",
          cursor: openChainModal ? "pointer" : "default",
          display: "inline-flex",
          fontFamily: "Inter, -apple-system, system-ui, sans-serif",
          fontSize: 13,
          fontWeight: 600,
          height: 36,
          lineHeight: 1,
          padding: "0 12px",
          whiteSpace: "nowrap",
        }}
      >
        Wrong Network
      </button>
    );
  }

  return (
    <ConnectButtonRainbowKit
      chainStatus="none"
      accountStatus={width < 1800 ? "avatar" : "full"}
      {...props}
    />
  );
};

export default ConnectButton;
