import { EnsIdentity } from "@lib/api/types/get-ens";
import { Box, Skeleton } from "@livepeer/design-system";
import { useEffect, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";

type Identity = Pick<EnsIdentity, "avatar" | "isLoading"> | null | undefined;

type Props = {
  identity: Identity;
  address: string;
  size?: number;
  css?: object;
};

const IdentityAvatar = ({
  identity,
  address,
  size = 24,
  css = {},
}: Props) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [hasAvatarError, setHasAvatarError] = useState(false);

  useEffect(() => {
    setImageLoaded(false);
    setHasAvatarError(false);
  }, [identity?.avatar, address]);

  const avatarSrc = identity?.avatar ?? null;
  const awaitingEnsData = identity?.isLoading && !avatarSrc;

  const baseStyles = {
    borderRadius: 1000,
    width: size,
    height: size,
    maxWidth: size,
    maxHeight: size,
    overflow: "hidden",
    position: "relative",
    ...css,
  };

  if (!avatarSrc || hasAvatarError || awaitingEnsData) {
    return (
      <Box css={baseStyles}>
        {awaitingEnsData ? (
          <Skeleton
            css={{
              width: "100%",
              height: "100%",
              borderRadius: 1000,
            }}
          />
        ) : (
          <QRCodeCanvas
            fgColor={`#${address.slice(2, 8)}`}
            size={size}
            value={address}
          />
        )}
      </Box>
    );
  }

  return (
    <Box css={baseStyles}>
      {!imageLoaded && (
        <Skeleton
          css={{
            width: "100%",
            height: "100%",
            borderRadius: 1000,
          }}
        />
      )}
      <Box
        as="img"
        css={{
          width: "100%",
          height: "100%",
          borderRadius: 1000,
          position: "absolute",
          top: 0,
          left: 0,
          objectFit: "cover",
          opacity: imageLoaded ? 1 : 0,
          transition: "opacity 150ms ease",
        }}
        src={avatarSrc}
        onLoad={() => setImageLoaded(true)}
        onError={() => setHasAvatarError(true)}
      />
    </Box>
  );
};

export default IdentityAvatar;
