import { Pre } from "@components/Pre";
import { Box, IconButton } from "@livepeer/design-system";
import { CheckIcon,ClipboardIcon } from "@radix-ui/react-icons";
import copy from "copy-to-clipboard";
import { useEffect, useRef, useState } from "react";

export function CodeBlock({
  className = "code-block",
  children,
  id,
  showLineNumbers = false,
  isHighlightingLines = true,
  css = {},
}) {
  const [hasCopied, setHasCopied] = useState(false);
  const [code, setCode] = useState<string | undefined>(undefined);
  const preRef = useRef<HTMLPreElement | null>(null);

  useEffect(() => {
    if (preRef.current) {
      const codeElement = preRef.current?.querySelector("code");
      // remove double line breaks
      const code = codeElement?.innerText.replace(/\n{3,}/g, "\n");
      if (code) {
        setCode(code);
      }
    }
  }, [preRef]);

  useEffect(() => {
    if (hasCopied && code) copy(code);
    setTimeout(() => setHasCopied(false), 1500);
  }, [code, hasCopied]);

  return (
    <Box
      css={{
        position: "relative",
        ...css,
      }}
    >
      <Box
        css={{
          overflow: "auto",
          borderRadius: "$3",
          backgroundColor: "$primary3",
          paddingTop: "$4",
          paddingBottom: "$4",
          "& > pre": {
            backgroundColor: "transparent",
            overflow: "visible",
            paddingTop: 0,
            paddingBottom: 0,
            float: "left",
            minWidth: "100%",
            $$outline: "none",
            borderRadius: 0,
          },
        }}
      >
        <Pre
          ref={preRef}
          data-invert-line-highlight={isHighlightingLines}
          data-line-numbers={showLineNumbers}
          className={className}
          id={id}
        >
          <code className={className}>{children}</code>
        </Pre>
      </Box>
      <IconButton
        aria-label="Copy code to clipboard"
        css={{
          cursor: "pointer",
          color: "$hiContrast",
          position: "absolute",
          top: "$2",
          right: "$2",
          display: "inline-flex",
          opacity: 1,
          transition: "background-color .3s",
          "&:hover": {
            bc: "$primary5",
            transition: "background-color .3s",
          },
        }}
        onClick={() => setHasCopied(true)}
      >
        {hasCopied ? <CheckIcon /> : <ClipboardIcon />}
      </IconButton>
    </Box>
  );
}
