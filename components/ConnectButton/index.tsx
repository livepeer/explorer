import dynamic from "next/dynamic";

const ConnectButton = dynamic(() => import("components/ConnectButton/Test"), {
  ssr: false,
});

export default function ConnectButtonComponent(props) {
  return <ConnectButton {...props} />;
}
