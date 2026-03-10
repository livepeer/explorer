import { Box } from "@livepeer/design-system";
import { ChatBubbleIcon } from "@modulz/radix-icons";

import { useExplorerStore } from "../../hooks";
import ChatPanel from "./ChatPanel";

export default function AiChat() {
  const { aiChatOpen, setAiChatOpen } = useExplorerStore();

  return (
    <>
      {/* FAB - Floating Action Button */}
      {!aiChatOpen && (
        <Box
          as="button"
          onClick={() => setAiChatOpen(true)}
          aria-label="Open AI Chat"
          css={{
            position: "fixed",
            bottom: 20,
            right: 20,
            width: 56,
            height: 56,
            borderRadius: "50%",
            backgroundColor: "$primary9",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
            zIndex: 999,
            transition: "transform 0.2s, box-shadow 0.2s",
            "&:hover": {
              transform: "scale(1.05)",
              boxShadow: "0 6px 20px rgba(0,0,0,0.3)",
            },
            "&:active": {
              transform: "scale(0.95)",
            },
          }}
        >
          <ChatBubbleIcon width={24} height={24} />
        </Box>
      )}

      {/* Chat Panel */}
      {aiChatOpen && <ChatPanel onClose={() => setAiChatOpen(false)} />}
    </>
  );
}
