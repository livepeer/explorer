import { styled } from "@livepeer/design-system";
import OriginalReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import React from "react";

type MarkdownRendererProps = {
  children: string;
} & React.ComponentProps<typeof OriginalReactMarkdown>;

// Common breakpoint
const mobileBreakpoint = "@media (max-width: 768px)";

// Utility function to remove trailing slashes
const cleanUrl = (url: string): string => url.replace(/\/+$/, '');

const StyledTable = styled('table', {
  borderCollapse: "collapse",
  borderSpacing: 0,
  width: "100%",
  marginBottom: "$4",
  display: "block",
  overflowX: "auto",
  "-webkit-overflow-scrolling": "touch",
  [mobileBreakpoint]: {
    padding: "$1 $2", // Reduced padding on mobile
    fontSize: "$2",
    whiteSpace: "nowrap",
  },
});

const StyledTh = styled('th', {
  padding: "$2 $4",
  borderBottom: "3px solid $neutral7",
  textAlign: "left !important",
  minWidth: "150px", // Ensures columns don't get too narrow
  whiteSpace: "nowrap", // Prevents header text from wrapping
  [mobileBreakpoint]: {
    padding: "$1 $2", // Reduced padding on mobile
    fontSize: "$2",
    whiteSpace: "nowrap",
  },
});

const StyledTd = styled('td', {
  padding: "$2 $4",
  borderBottom: "1px solid $neutral7",
  textAlign: "left !important",
  minWidth: "150px", // Ensures columns don't get too narrow
  [mobileBreakpoint]: {
    padding: "$1 $2", // Reduced padding on mobile
    fontSize: "$2",
    whiteSpeace: "nowrap",
  }
});

const StyledMarkdown = styled(OriginalReactMarkdown, {
  // List styling
  "ul, ol": {
    li: {
      [mobileBreakpoint]: {
        fontSize: "$3",
        lineHeight: "$2",
      },
    },
  },

  // Headings
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

const StyledImage = styled('img', {
  maxWidth: '100%',
  height: 'auto',
  maxHeight: '400px',
  display: 'block',
  margin: '$2 0'
});

const isImageUrl = (url: string): boolean => {
  return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
};

const MarkdownImage = React.memo(({ src, alt, ...imgProps }: React.ImgHTMLAttributes<HTMLImageElement>) => {
  if (!src) return null;
  const cleanedSrc = cleanUrl(src);
  return (
    <StyledImage
      src={cleanedSrc}
      alt={alt || ''} // Consider a more descriptive default alt text
      {...imgProps}
    />
  );
});
MarkdownImage.displayName = 'MarkdownImage';

/**
 * MarkdownRenderer - A component for rendering markdown content with custom styling
 *
 * @component
 * @param {string} children - The markdown content to render
 * @param {Object} props - Additional props passed to react-markdown
 */
const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ children, ...props }) => {
  // Always validate children first
  const safeChildren = typeof children === 'string' ? children : '';

  // Always call useMemo, regardless of children content
  const components: React.ComponentProps<typeof OriginalReactMarkdown>['components'] = React.useMemo(() => ({
    img: MarkdownImage,
    a: ({ href, children, ...props }) => {
      if (href && isImageUrl(href)) {
        return (
          <MarkdownImage
            src={href}
            alt={typeof children === 'string' ? children : ''}
          />
        );
      }
      return <a href={href} {...props}>{children}</a>;
    },
    table: StyledTable,
    th: (props) => {
      const { ref, ...rest } = props;
      return <StyledTh ref={(node) => {
        if (typeof ref === 'function') {
          ref(node);
        }
      }} {...rest} />;
    },
    td: (props) => {
      const { ref, ...rest } = props;
      return <StyledTd ref={(node) => {
        if (typeof ref === 'function') {
          ref(node);
        }
      }} {...rest} />;
    },
  }), []);

  // Return null if children is not a string
  if (!safeChildren) {
    console.warn('MarkdownRenderer: children prop must be a string');
    return null;
  }

  return (
    <StyledMarkdown
      remarkPlugins={[remarkGfm]}
      components={components}
      {...props}
    >
      {safeChildren}
    </StyledMarkdown>
  );
};
MarkdownRenderer.displayName = 'MarkdownRenderer';

export default React.memo(MarkdownRenderer);
