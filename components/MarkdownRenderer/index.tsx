import { styled } from "@jjasonn.stone/design-system";
import OriginalReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Image from "next/image";

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
          return (
            <div style={{ position: 'relative', width: '100%', height: '400px', margin: '8px 0' }}>
              <Image
                src={cleanSrc}
                alt={alt || ''}
                fill
                style={{ objectFit: 'contain' }}
                {...imgProps}
              />
            </div>
          );
        },
        a: ({ node, href, children, ...props }) => {
          if (href && isImageUrl(href)) {
            return (
              <div style={{ position: 'relative', width: '100%', height: '400px', margin: '8px 0' }}>
                <Image
                  src={href.replace(/\/+$/, '')}
                  alt={typeof children === 'string' ? children : ''}
                  fill
                  style={{ objectFit: 'contain' }}
                  {...props}
                />
              </div>
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
