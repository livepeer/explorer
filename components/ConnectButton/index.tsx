import dynamic from "next/dynamic";
import type { ComponentType } from "react";

const RKConnectButton = dynamic(
  () => import("@rainbow-me/rainbowkit").then((m) => m.ConnectButton),
  { ssr: false }
) as ComponentType<any>;

const ConnectButton = (props: any) => {
  return <RKConnectButton chainStatus="name" {...props} />;
};

export default ConnectButton;
