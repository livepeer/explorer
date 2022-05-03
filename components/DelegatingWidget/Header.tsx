import QRCode from "qrcode.react";
import { Heading, Box, Flex } from "@livepeer/design-system";

const Header = ({ transcoder, delegateProfile }) => {
  return (
    <Box
      css={{
        pt: "$3",
        pb: "$2",
        px: "$3",
        display: "flex",
        alignItems: "center",
        fontWeight: "bold",
      }}
    >
      <Flex
        css={{ minWidth: 40, minHeight: 40, position: "relative", mr: "$2" }}
      >
        {delegateProfile?.image ? (
          <Box
            as="img"
            css={{
              objectFit: "cover",
              borderRadius: 1000,
              width: 40,
              height: 40,
            }}
            src={delegateProfile.image}
          />
        ) : (
          <QRCode
            style={{
              borderRadius: 1000,
              width: 40,
              height: 40,
            }}
            fgColor={`#${transcoder?.id.substr(2, 6)}`}
            value={transcoder?.id}
          />
        )}
      </Flex>
      <Flex css={{ flexDirection: "column" }}>
        <Heading size="1" css={{ fontWeight: 700 }}>
          {delegateProfile?.name
            ? delegateProfile.name
            : transcoder.id.replace(transcoder.id.slice(7, 37), "…")}
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
