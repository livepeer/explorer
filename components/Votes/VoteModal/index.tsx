import { Box, Text } from "@livepeer/design-system";
import { Cross1Icon } from "@radix-ui/react-icons";
import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

interface VoteModalProps {
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  header?: React.ReactNode;
}

const Index: React.FC<VoteModalProps> = ({
  onClose,
  children,
  title,
  header,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Disable scroll on mount
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";

    // Focus management
    const focusableElementsSelector =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const firstFocusableElement = modalRef.current?.querySelectorAll(
      focusableElementsSelector
    )[0] as HTMLElement;

    if (firstFocusableElement) {
      firstFocusableElement.focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }

      if (e.key === "Tab") {
        const focusableContent = modalRef.current?.querySelectorAll(
          focusableElementsSelector
        );
        if (!focusableContent) return;

        const focusableArray = Array.from(focusableContent) as HTMLElement[];
        const firstElement = focusableArray[0];
        const lastElement = focusableArray[focusableArray.length - 1];

        if (e.shiftKey) {
          // if shift key pressed for shift + tab combination
          if (document.activeElement === firstElement) {
            lastElement.focus(); // add focus for the last focusable element
            e.preventDefault();
          }
        } else {
          // if tab key is pressed
          if (document.activeElement === lastElement) {
            // if focused has reached to last element then focus again first element
            firstElement.focus(); // add focus for the first focusable element
            e.preventDefault();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalStyle;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return createPortal(
    <Box
      css={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        backdropFilter: "blur(4px)",
        zIndex: 9999,
      }}
      onClick={onClose}
    >
      <Box
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        css={{
          position: "relative",
          backgroundColor: "$neutral3",
          borderRadius: "$2",
          width: "75%",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          "@bp2": { width: "50%" },
          borderTop: "4px solid $primary11",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <Box
          css={{
            position: "sticky",
            top: 0,
            zIndex: 10,
            backgroundColor: "$neutral3",
            paddingLeft: "$4",
            paddingRight: "$4",
            paddingTop: "$4",
            paddingBottom: "$2",
            borderBottom: "1px solid $neutral5",
            borderTopLeftRadius: "$2",
            borderTopRightRadius: "$2",
          }}
        >
          <Box
            css={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: header ? "$3" : 0,
            }}
          >
            {title && (
              <Box
                id="modal-title"
                css={{ fontSize: "$4", fontWeight: 700, color: "$white" }}
              >
                {title}
              </Box>
            )}
            <Box css={{ display: "flex", alignItems: "center", gap: "$3" }}>
              <Text
                size="1"
                variant="neutral"
                css={{
                  display: "none",
                  "@bp2": { display: "block" },
                  color: "$neutral10",
                  backgroundColor: "$neutral4",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  fontSize: "10px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                }}
              >
                ESC TO CLOSE
              </Text>
              <Box
                as="button"
                onClick={onClose}
                aria-label="Close modal"
                css={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  cursor: "pointer",
                  border: "none",
                  backgroundColor: "$neutral5",
                  color: "$neutral11",
                  "&:hover": {
                    backgroundColor: "$green3",
                    color: "$green11",
                    transform: "rotate(90deg)",
                  },
                  "&:focus-visible": {
                    outline: "2px solid $primary11",
                    outlineOffset: "2px",
                  },
                  transition: "all 0.2s",
                }}
              >
                <Cross1Icon />
              </Box>
            </Box>
          </Box>
          {header && <Box>{header}</Box>}
        </Box>

        <Box
          css={{
            overflowY: "auto",
            paddingLeft: "$4",
            paddingRight: "$4",
            paddingTop: "$4",
            paddingBottom: "$4",
            maxHeight: "calc(90vh - 100px)",
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>,
    document.body
  );
};

export default Index;
