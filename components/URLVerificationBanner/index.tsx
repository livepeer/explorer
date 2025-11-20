import React from "react";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Flex,
  Text,
} from "@livepeer/design-system";
import { FiAlertTriangle, FiX } from "react-icons/fi";

type URLVerificationBannerProps = {
  onDismiss: () => void;
};

const URLVerificationBanner: React.FC<URLVerificationBannerProps> = ({
  onDismiss,
}) => {
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  const handleConfirm = () => {
    setConfirmOpen(false);
    onDismiss();
  };

  return (
    <>
      <Flex
        role="status"
        css={{
          width: "100%",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "$amber3",
          borderBottom: "1px solid $amber6",
          fontSize: "$2",
          gap: "$2",
          paddingLeft: "$4",
          paddingRight: "$7",
          paddingTop: "$2",
          paddingBottom: "$2",
          position: "relative",
          textAlign: "center",
          "@bp3": {
            fontSize: "$3",
          },
        }}
      >
        <Box
          as={FiAlertTriangle}
          aria-hidden="true"
          css={{
            color: "$amber11",
            width: 16,
            height: 16,
            flexShrink: 0,
          }}
        />
        <Text
          css={{
            color: "$amber11",
            fontWeight: 400,
            lineHeight: 1.4,
          }}
        >
          Please ensure you are on{" "}
          <Box as="span" css={{ fontWeight: 600 }}>
            explorer.livepeer.org
          </Box>{" "}
          — check the URL carefully.
        </Text>
        <Box
          as="button"
          type="button"
          onClick={() => setConfirmOpen(true)}
          aria-label="Dismiss warning"
          css={{
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "none",
            background: "none",
            padding: 4,
            color: "$amber11",
            position: "absolute",
            right: "$3",
            top: "50%",
            transform: "translateY(-50%)",
            width: 22,
            height: 22,
            fontSize: "18px",
            transition: "opacity 150ms ease",
            "&:hover": { opacity: 0.7 },
            "&:focus-visible": {
              outline: "2px solid $amber11",
              outlineOffset: 2,
            },
          }}
        >
          <FiX aria-hidden="true" />
        </Box>
      </Flex>
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent
          css={{
            maxWidth: 420,
            textAlign: "left",
          }}
          onPointerEnterCapture={undefined}
          onPointerLeaveCapture={undefined}
          placeholder={undefined}
        >
          <DialogTitle asChild>
            <Text
              as="h2"
              css={{ fontWeight: 600, fontSize: "$4", marginBottom: "$3" }}
            >
              Hide this reminder?
            </Text>
          </DialogTitle>
          <Text css={{ marginBottom: "$4", color: "$neutral11" }}>
            We show this warning to help prevent phishing. If you hide it,
            please continue double-checking the URL before connecting a wallet.
          </Text>
          <Flex
            css={{
              justifyContent: "flex-end",
              gap: "$2",
              flexDirection: "column",
              "@bp2": {
                flexDirection: "row",
              },
            }}
          >
            <Button
              size="3"
              ghost
              onClick={() => setConfirmOpen(false)}
              css={{
                minWidth: 120,
                width: "100%",
                "@bp2": {
                  width: "auto",
                },
              }}
            >
              Keep Reminder
            </Button>
            <Button
              size="3"
              variant="primary"
              onClick={handleConfirm}
              css={{
                minWidth: 120,
                width: "100%",
                "@bp2": {
                  width: "auto",
                },
              }}
            >
              Dismiss Banner
            </Button>
          </Flex>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default URLVerificationBanner;
