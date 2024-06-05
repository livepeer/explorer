import { styled } from "@livepeer/design-system";
import OriginalReactMarkdown from "react-markdown";

/**
 * A styled ReactMarkdown component for consistent markdown rendering in the
 * Livepeer Explorer.
 */
const MarkdownRenderer = styled(OriginalReactMarkdown, {
  // Improve table styling.
  table: {
    borderCollapse: "collapse",
    borderSpacing: 0,
    "th, td": {
      padding: "$2 $4", // Use consistent padding units
      borderBottom: "1px solid $neutral7",
      textAlign: "left !important",
    },
    th: {
      borderBottom: "3px solid $neutral7",
    },
  },
});

export default MarkdownRenderer;
