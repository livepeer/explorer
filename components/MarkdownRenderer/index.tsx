import { styled } from "@jjasonn.stone/design-system";
import OriginalReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * A styled ReactMarkdown component for consistent markdown rendering in the
 * Livepeer Explorer.
 */
const StyledMarkdown = styled(OriginalReactMarkdown, {
  // Improve table styling.
  table: {
    borderCollapse: "collapse",
    borderSpacing: 0,
    width: "100%",
    marginBottom: "$4",
    display: "block",
    overflowX: "auto",
    "-webkit-overflow-scrolling": "touch",
    "th, td": {
      padding: "$2 $4",
      borderBottom: "1px solid $neutral7",
      textAlign: "left !important",
      minWidth: "150px", // Ensures columns don't get too narrow
      "@media (max-width: 768px)": {
        padding: "$1 $2", // Reduced padding on mobile
      }
    },
    th: {
      borderBottom: "3px solid $neutral7",
      whiteSpace: "nowrap", // Prevents header text from wrapping
    },
  },
  img: {
    maxWidth: "100%",
    height: "auto",
    maxHeight: "400px"
  },
  // Handle long URLs
  a: {
    wordBreak: "break-word",
    overflowWrap: "break-word",
    display: "inline-block",
    maxWidth: "100%",
  }
});

const MarkdownRenderer = (props) => (
  <StyledMarkdown remarkPlugins={[remarkGfm]} {...props} />
);

export default MarkdownRenderer;
