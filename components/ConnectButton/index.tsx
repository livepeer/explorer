import { ConnectButton as ConnectButtonRainbowKit } from "@rainbow-me/rainbowkit";
import { ConnectButtonProps } from "@rainbow-me/rainbowkit/dist/components/ConnectButton/ConnectButton";
import { useWindowSize } from "react-use";

const ConnectButton = (props: ConnectButtonProps) => {
  const { width } = useWindowSize();
  return (
    <ConnectButtonRainbowKit
      chainStatus="none"
      accountStatus={width < 1800 ? "avatar" : "full"}
      {...props}
    />
  );
};

export default ConnectButton;
