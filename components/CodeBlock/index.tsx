import React from "react";
import { Box, IconButton } from "@livepeer/design-system";
import copy from "copy-to-clipboard";
import { ClipboardIcon, CheckIcon } from "@radix-ui/react-icons";
import { Pre } from "@components/Pre";

export function CodeBlock({
  className = "code-block",
  children,
  id,
  showLineNumbers = false,
  variant,
  isHighlightingLines = true,
  css = {},
}) {
  const [hasCopied, setHasCopied] = React.useState(false);
  const [code, setCode] = React.useState(undefined);
  const preRef = React.useRef(null);

  React.useEffect(() => {
    if (preRef.current) {
      const codeElement = preRef.current.querySelector("code");
      // remove double line breaks
      const code = codeElement.innerText.replace(/\n{3,}/g, "\n");
      setCode(code);
    }
  }, [preRef]);

  React.useEffect(() => {
    if (hasCopied) copy(code);
    setTimeout(() => setHasCopied(false), 1500);
  }, [hasCopied]);

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
          py: "$4",
          "& > pre": {
            backgroundColor: "transparent",
            overflow: "visible",
            py: 0,
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
          variant={variant}
          className={className}
          id={id}
        >
          <code className={className} children={children} />
        </Pre>
      </Box>
      <IconButton
        aria-label="Copy code to clipboard"
        css={{
          color: "$primary11",
          position: "absolute",
          top: "$2",
          right: "$2",
          display: "inline-flex",
          opacity: 1,
        }}
        onClick={() => setHasCopied(true)}
      >
        {hasCopied ? <CheckIcon /> : <ClipboardIcon />}
      </IconButton>
    </Box>
  );
}
