import { formatAddress, textTruncate } from "@lib/utils";
import { Box, Flex } from "@livepeer/design-system";
import { useEnsData } from "hooks";
import { QRCodeCanvas } from "qrcode.react";

const ActiveCircle = ({ css = {}, active }) => {
  return (
    <Box
      className="status"
      css={{
        position: "absolute",
        right: "-2px",
        bottom: "-2px",
        backgroundColor: active ? "$primary10" : "$neutral5",
        border: "3px solid",
        borderColor: "$neutral6",
        boxSizing: "border-box",
        width: 14,
        height: 14,
        borderRadius: 1000,
        ...css,
      }}
    />
  );
};

const Index = ({ active, address }) => {
  const identity = useEnsData(address);
  return (
    <Flex css={{ alignItems: "center" }}>
      <Flex
        css={{
          minWidth: 30,
          minHeight: 30,
          position: "relative",
          marginRight: "$3",
        }}
      >
        {identity?.avatar ? (
          <Box
            as="img"
            css={{
              objectFit: "cover",
              borderRadius: 1000,
              width: 30,
              height: 30,
              padding: "2px",
              border: "1px solid",
              borderColor: "$neutral5",
            }}
            src={identity.avatar}
            alt={
              identity?.name ? `${identity.name} avatar` : `${address} avatar`
            }
          />
        ) : (
          <QRCodeCanvas
            style={{
              borderRadius: 1000,
              width: 24,
              height: 24,
              padding: "2px",
              border: "1px solid",
              borderColor: "rgba(255,255,255,.6)",
            }}
            fgColor={`#${address.substr(2, 6)}`}
            value={address}
          />
        )}
        <ActiveCircle active={active} />
      </Flex>

      <Flex
        css={{
          color: "$text",
          transition: "all .3s",
          borderBottom: "1px solid",
          borderColor: "transparent",
          justifyContent: "space-between",
          width: "100%",
          minWidth: "100%",
        }}
      >
        <Flex
          className="orchestratorLink"
          css={{
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box css={{ fontWeight: 600 }}>
            {identity?.name
              ? textTruncate(identity.name, 12, "…")
              : formatAddress(address)}
          </Box>
        </Flex>
      </Flex>
    </Flex>
  );
};

export default Index;
