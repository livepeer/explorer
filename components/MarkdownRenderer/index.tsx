import { styled } from "@jjasonn.stone/design-system";
import OriginalReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import React from "react";

type MarkdownRendererProps = {
  children: string;
} & React.ComponentProps<typeof OriginalReactMarkdown>;

type CustomComponents = {
  p: React.FC<{ children: React.ReactNode }>;
  img: React.FC<React.ImgHTMLAttributes<HTMLImageElement>>;
  a: React.FC<React.AnchorHTMLAttributes<HTMLAnchorElement> & { node?: any }>;
};

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
});

const StyledImage = styled('img', {
  maxWidth: '100%',
  height: 'auto',
  maxHeight: '400px',
  display: 'block',
  margin: '$2 0'
});

const StyledLink = styled('a', {
  color: '$green11',
  textDecoration: 'underline',
  wordBreak: 'break-word',
  overflowWrap: 'break-word',
  display: 'inline-block',
  maxWidth: '100%'
});

const StyledParagraph = styled('p', {
  margin: '$2 0'
});

const isImageUrl = (url: string): boolean => {
  const cleanUrl = url.replace(/\/+$/, '');
  return /\.(jpg|jpeg|png|gif|webp)$/i.test(cleanUrl);
};

const MarkdownImage: CustomComponents['img'] = React.memo(({ src, alt, ...imgProps }) => {
  if (!src) return null;
  const cleanSrc = src.replace(/\/+$/, '');
  return (
    <StyledImage
      src={cleanSrc}
      alt={alt || ''}
      {...imgProps}
    />
  );
});
MarkdownImage.displayName = 'MarkdownImage';

const MarkdownLink: CustomComponents['a'] = React.memo(({ href, children, ...props }) => {
  const isExternal = href?.startsWith('http');
  return (
    <StyledLink
      href={href}
      rel={isExternal ? "noopener noreferrer" : undefined}
      target={isExternal ? "_blank" : undefined}
      {...props}
    >
      {children}
    </StyledLink>
  );
});
MarkdownLink.displayName = 'MarkdownLink';

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
  const components = React.useMemo(() => ({
    p: ({ children }) => <StyledParagraph>{children}</StyledParagraph>,
    img: MarkdownImage,
    a: ({ href, children, ...props }) => {
      if (href && isImageUrl(href)) {
        return (
          <MarkdownImage
            src={href.replace(/\/+$/, '')}
            alt={typeof children === 'string' ? children : ''}
          />
        );
      }
      return <MarkdownLink href={href} {...props}>{children}</MarkdownLink>;
    }
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
