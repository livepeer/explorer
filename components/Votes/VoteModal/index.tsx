"use client";

import React from "react";
import { createPortal } from "react-dom";
import { Box, Button } from "@livepeer/design-system";

interface VoteModalProps {
  onClose: () => void;
  children: React.ReactNode;
}

const Index: React.FC<VoteModalProps> = ({ onClose, children }) =>
  createPortal(
    <Box
      css={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        backdropFilter: "blur(4px)",
        zIndex: 9999,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <Box
        css={{
          position: "relative",
          backgroundColor: "$neutral3",
          borderRadius: "$2",
          width: "90%",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          "@bp2": { width: "50%" },
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <Box
          css={{
            position: "sticky",
            top: 0,
            right: 0,
            zIndex: 10,
            backgroundColor: "$neutral3",
            px: "$4",
            py: "$2",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <Button
            variant="gray"
            css={{
              "&:hover": { backgroundColor: "$red6" },
            }}
            onClick={onClose}
          >
            Close
          </Button>
        </Box>

        <Box
          css={{
            overflowY: "auto",
            px: "$4",
            py: "$2",
            maxHeight: "calc(90vh - 56px)",
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>,
    document.body
  );

export default Index;
