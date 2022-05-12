import { ConnectButton as ConnectButtonRainbowKit } from "@rainbow-me/rainbowkit";
import { ConnectButtonProps } from "@rainbow-me/rainbowkit/dist/components/ConnectButton/ConnectButton";

const ConnectButton = (props: ConnectButtonProps) => {
  return <ConnectButtonRainbowKit {...props} />;
};

export default ConnectButton;
