import { EnsIdentity } from "@lib/api/types/get-ens";
import { formatAddress } from "@lib/utils";
import { Box, Flex, Heading } from "@livepeer/design-system";
import { QRCodeCanvas } from "qrcode.react";

import { TranscoderOrDelegateType } from ".";

const Header = ({
  transcoder,
  delegateProfile,
}: {
  transcoder: TranscoderOrDelegateType;
  delegateProfile: EnsIdentity | undefined;
}) => {
  return (
    <Box
      css={{
        paddingTop: "$3",
        paddingBottom: "$2",
        paddingLeft: "$3",
        paddingRight: "$3",
        display: "flex",
        alignItems: "center",
        fontWeight: "bold",
      }}
    >
      <Flex
        css={{
          minWidth: 40,
          minHeight: 40,
          position: "relative",
          marginRight: "$2",
        }}
      >
        {delegateProfile?.avatar ? (
          <Box
            as="img"
            css={{
              objectFit: "cover",
              borderRadius: 1000,
              width: 40,
              height: 40,
            }}
            src={delegateProfile.avatar}
            alt={
              delegateProfile?.name
                ? `${delegateProfile.name} avatar`
                : `${delegateProfile?.id || "delegate"} avatar`
            }
          />
        ) : (
          <QRCodeCanvas
            style={{
              borderRadius: 1000,
              width: 40,
              height: 40,
            }}
            fgColor={`#${transcoder?.id.substr(2, 6)}`}
            value={transcoder?.id ?? ""}
          />
        )}
      </Flex>
      <Flex css={{ flexDirection: "column" }}>
        <Heading size="1" css={{ fontWeight: 700 }}>
          {delegateProfile?.name
            ? delegateProfile.name
            : formatAddress(transcoder?.id)}
        </Heading>
        <Box
          css={{
            fontWeight: "normal",
            color: "$muted",
            fontSize: "$2",
            lineHeight: 1.5,
            textTransform: "initial",
          }}
        />
      </Flex>
    </Box>
  );
};

export default Header;
