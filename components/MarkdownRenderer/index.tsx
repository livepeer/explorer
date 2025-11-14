import { isImageUrl } from "@lib/utils";
import { styled } from "@livepeer/design-system";
import React from "react";
import OriginalReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const StyledTable = styled("table", {
  borderCollapse: "collapse",
  borderSpacing: 0,
  width: "100%",
  marginBottom: "$4",
  display: "block",
  overflowX: "auto",
  "-webkit-overflow-scrolling": "touch",
  "@bp2": {
    padding: "$1 $2",
    fontSize: "$2",
    whiteSpace: "nowrap",
  },
});

const StyledTh = styled("th", {
  padding: "$2 $4",
  borderBottom: "3px solid $neutral7",
  textAlign: "left !important",
  minWidth: "150px",
  whiteSpace: "nowrap",
  "@bp2": {
    padding: "$1 $2",
    fontSize: "$2",
    whiteSpace: "nowrap",
  },
});

const StyledTd = styled("td", {
  padding: "$2 $4",
  borderBottom: "1px solid $neutral7",
  textAlign: "left !important",
  minWidth: "150px",
  "@bp2": {
    padding: "$1 $2",
    fontSize: "$2",
    whiteSpace: "nowrap",
  },
});

const StyledImage = styled("img", {
  maxWidth: "100%",
  height: "auto",
  maxHeight: "400px",
  display: "block",
  margin: "$2 0",
});

const StyledReactMarkdown = styled(OriginalReactMarkdown, {
  "ul, ol": {
    li: {
      "@bp2": {
        fontSize: "$3",
        lineHeight: "$2",
      },
    },
  },
  h2: {
    fontWeight: 600,
    "&:first-of-type": { mt: 0 },
    mt: "$3",
  },
  h3: { fontWeight: 600, mt: "$3" },
  h4: { fontWeight: 600, mt: "$3" },
  h5: { fontWeight: 600, mt: "$3" },
  lineHeight: 1.5,
  a: {
    color: "$primary11",
    wordBreak: "break-all",
  },
  pre: {
    whiteSpace: "pre-wrap",
    overflow: "auto",
  },
});

/**
 * Component for rendering markdown images with custom styling.
 * @param src - The image source URL.
 * @param alt - The image alt text.
 * @param imgProps - Additional props passed to the img element.
 */
const MarkdownImage = React.memo(
  ({ src, alt, ...imgProps }: React.ImgHTMLAttributes<HTMLImageElement>) => {
    if (!src) return null;
    const cleanedSrc = (src as string)?.replace(/\/+$/, "") ?? "";
    return (
      <StyledImage
        src={cleanedSrc}
        alt={alt || "Markdown content image"}
        {...imgProps}
      />
    );
  }
);
MarkdownImage.displayName = "MarkdownImage";

type MarkdownRendererProps = {
  children: string;
} & React.ComponentProps<typeof OriginalReactMarkdown>;

/**
 * A component for rendering markdown content with custom styling.
 * @param children - The markdown content to render.
 * @param props - Additional props passed to react-markdown.
 */
const MarkdownRenderer = ({
  children,
  ...props
}: MarkdownRendererProps): React.ReactElement | null => {
  const safeChildren = typeof children === "string" ? children : "";

  const components: React.ComponentProps<
    typeof OriginalReactMarkdown
  >["components"] = React.useMemo(
    () => ({
      img: MarkdownImage,
      a: ({ href, children, ...props }) => {
        if (href && isImageUrl(href)) {
          return (
            <MarkdownImage
              src={href}
              alt={typeof children === "string" ? children : ""}
            />
          );
        }
        return (
          <a href={href} {...props}>
            {children}
          </a>
        );
      },
      table: StyledTable,
      th: (props) => {
        const { ref, ...rest } = props;
        return (
          <StyledTh
            ref={(node) => {
              if (typeof ref === "function") {
                ref(node);
              }
            }}
            {...rest}
          />
        );
      },
      td: (props) => {
        const { ref, ...rest } = props;
        return (
          <StyledTd
            ref={(node) => {
              if (typeof ref === "function") {
                ref(node);
              }
            }}
            {...rest}
          />
        );
      },
    }),
    []
  );

  if (!safeChildren) {
    console.warn("MarkdownRenderer: children prop must be a string");
    return null;
  }

  return (
    <StyledReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={components}
      {...props}
    >
      {safeChildren}
    </StyledReactMarkdown>
  );
};
MarkdownRenderer.displayName = "MarkdownRenderer";

export default React.memo(MarkdownRenderer);
