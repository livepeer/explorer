import { ConnectButton as ConnectButtonRainbowKit } from "@rainbow-me/rainbowkit";
import { ConnectButtonProps } from "@rainbow-me/rainbowkit/dist/components/ConnectButton/ConnectButton";

const ConnectButton = (props: ConnectButtonProps) => {
  return (
    <>
      <style>{`
        [data-rk] button[data-testid="rk-connect-button"] {
          background-color: #113123 !important;
          color: #4cc38a !important;
        }
      `}</style>

      <ConnectButtonRainbowKit chainStatus="name" {...props} />
    </>
  );
};

export default ConnectButton;
