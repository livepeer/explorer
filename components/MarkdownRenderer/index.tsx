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
    maxHeight: "400px",
    display: "block",
    margin: "$2 0"
  },
});

const isImageUrl = (url: string) => {
  const cleanUrl = url.replace(/\/+$/, '');
  return /\.(jpg|jpeg|png|gif|webp)$/i.test(cleanUrl);
};

const MarkdownRenderer = ({ children, ...props }) => {
  return (
    <StyledMarkdown 
      remarkPlugins={[remarkGfm]} 
      components={{
        p: ({ children }) => <p style={{ margin: '1em 0' }}>{children}</p>,
        img: ({ src, alt, ...imgProps }) => {
          if (!src) return null;
          const cleanSrc = src.replace(/\/+$/, '');
          // eslint-disable-next-line @next/next/no-img-element
          return (
            <img
              src={cleanSrc}
              alt={alt || ''}
              style={{
                maxWidth: '100%',
                height: 'auto',
                maxHeight: '400px',
                display: 'block',
                margin: '8px 0'
              }}
              {...imgProps}
            />
          );
        },
        a: ({ node, href, children, ...props }) => {
          if (href && isImageUrl(href)) {
            // eslint-disable-next-line @next/next/no-img-element
            return (
              <img
                src={href.replace(/\/+$/, '')}
                alt={typeof children === 'string' ? children : ''}
                style={{
                  maxWidth: '100%',
                  height: 'auto',
                  maxHeight: '400px',
                  display: 'block',
                  margin: '8px 0'
                }}
              />
            );
          }
          return (
            <a 
              href={href} 
              style={{
                color: 'var(--colors-green11)',
                textDecoration: 'underline',
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
                display: 'inline-block',
                maxWidth: '100%'
              }}
              {...props}
            >
              {children}
            </a>
          );
        }
      }}
      {...props}
    >
      {children}
    </StyledMarkdown>
  );
};

export default MarkdownRenderer;
