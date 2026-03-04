import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  Flex,
  Heading,
  useSnackbar,
} from "@livepeer/design-system";
import { useEffect, useState } from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";

import Check from "../../public/img/check.svg";
import Copy from "../../public/img/copy.svg";

type Props = {
  voteId: string;
  idLabel: string;
  cliOptionName: string;
  voteInstructions: string;
};

const CliVotingInstructionsDialog = ({
  voteId,
  idLabel,
  cliOptionName,
  voteInstructions,
}: Props) => {
  const [copied, setCopied] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [openSnackbar] = useSnackbar();

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => {
        setCopied(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  return (
    <>
      <Box
        css={{
          display: "none",
          marginTop: "$3",
          fontSize: "$1",
          borderRadius: "$4",
          border: "1px solid $neutral4",
          padding: "$3",
          "@bp3": {
            display: "block",
          },
        }}
      >
        <Box css={{ lineHeight: 1.8 }}>
          Are you an orchestrator?{" "}
          <Box
            as="button"
            type="button"
            onClick={() => setModalOpen(true)}
            css={{
              color: "$primary11",
              cursor: "pointer",
              background: "none",
              border: "none",
              padding: 0,
              font: "inherit",
              textDecoration: "underline",
            }}
          >
            Follow these instructions
          </Box>{" "}
          if you prefer to vote with the Livepeer CLI.
        </Box>
      </Box>
      <Dialog onOpenChange={setModalOpen} open={modalOpen}>
        <DialogContent
          onPointerEnterCapture={undefined}
          onPointerLeaveCapture={undefined}
          placeholder={undefined}
        >
          <DialogTitle asChild>
            <Heading
              size="1"
              css={{ fontWeight: 700, width: "100%", marginBottom: "$4" }}
            >
              Livepeer CLI Voting Instructions
            </Heading>
          </DialogTitle>

          <Box as="ol" css={{ paddingLeft: 15 }}>
            <Box as="li" css={{ marginBottom: "$4" }}>
              <Box css={{ marginBottom: "$3" }}>
                Run the Livepeer CLI and select the option to &quot;
                {cliOptionName}&quot;. When prompted, copy and paste this{" "}
                {idLabel}:
              </Box>
              <Box
                css={{
                  padding: "$3",
                  marginBottom: "$2",
                  position: "relative",
                  color: "$primary11",
                  backgroundColor: "$primary4",
                  borderRadius: "$4",
                  fontWeight: 500,
                  wordBreak: "break-all",
                }}
              >
                {voteId}
                <CopyToClipboard
                  text={voteId}
                  onCopy={() => {
                    setCopied(true);
                    openSnackbar("Copied to clipboard");
                  }}
                >
                  <Flex
                    css={{
                      marginLeft: "$2",
                      marginTop: "3px",
                      position: "absolute",
                      right: 12,
                      top: 10,
                      cursor: "pointer",
                      borderRadius: 1000,
                      width: 26,
                      height: 26,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {copied ? (
                      <Check
                        css={{
                          width: 12,
                          height: 12,
                        }}
                      />
                    ) : (
                      <Copy
                        css={{
                          width: 12,
                          height: 12,
                        }}
                      />
                    )}
                  </Flex>
                </CopyToClipboard>
              </Box>
            </Box>
            <Box as="li" css={{ marginBottom: "$4" }}>
              <Box css={{ marginBottom: "$3" }}>
                The Livepeer CLI will prompt you for your vote.{" "}
                {voteInstructions}
              </Box>
            </Box>
            <Box as="li" css={{ marginBottom: 0 }}>
              <Box css={{ marginBottom: "$3" }}>
                Once your vote is confirmed, check back here to see it reflected
                in the UI.
              </Box>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CliVotingInstructionsDialog;
