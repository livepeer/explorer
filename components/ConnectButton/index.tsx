import {
  ConnectButton as ConnectButtonRainbowKit,
  useChainModal,
} from "@rainbow-me/rainbowkit";
import { useIsWrongRouteChain } from "hooks";
import type { ComponentProps } from "react";
import { useWindowSize } from "react-use";

type ConnectButtonProps = ComponentProps<typeof ConnectButtonRainbowKit>;

const ConnectButton = (props: ConnectButtonProps) => {
  const { width } = useWindowSize();
  const isWrongRouteChain = useIsWrongRouteChain();
  const { openChainModal } = useChainModal();

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
