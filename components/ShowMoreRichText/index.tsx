import { Box, Flex } from "@livepeer/design-system";
import { ChevronDownIcon, ChevronUpIcon } from "@modulz/radix-icons";
import {
  ReactNode,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

interface ShowMoreRichTextProps {
  children: ReactNode;
  lines?: number;
  lessIcon?: ReactNode;
  lessText?: string;
  moreIcon?: ReactNode;
  moreText?: string;
}

const subscribe = () => () => {};
const useIsClient = () =>
  useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );

const Index = ({
  children,
  lines = 3,
  lessIcon = <ChevronUpIcon />,
  lessText = "Show less",
  moreIcon = <ChevronDownIcon />,
  moreText = "Show more",
}: ShowMoreRichTextProps) => {
  const [expanded, setExpanded] = useState(false);
  const [needsToggle, setNeedsToggle] = useState(false);
  const isClient = useIsClient();
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (expanded) return; // Skip when expanded - we know it overflows

    const el = contentRef.current;
    if (!el) return;

    const check = () => setNeedsToggle(el.scrollHeight > el.clientHeight);
    check();

    const observer = new ResizeObserver(check);
    observer.observe(el);
    return () => observer.disconnect();
  }, [expanded]);

  return (
    <Box>
      <Box
        ref={contentRef}
        css={
          expanded
            ? {}
            : {
                display: "-webkit-box",
                WebkitBoxOrient: "vertical",
                WebkitLineClamp: lines,
                overflow: "hidden",
              }
        }
      >
        {children}
      </Box>

      {isClient && needsToggle && (
        <Box
          as="button"
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((prev) => !prev)}
          css={{
            background: "none",
            border: "none",
            padding: 0,
            marginTop: "$2",
            cursor: "pointer",
            font: "inherit",
            color: "$primary11",
            "&:focus-visible": {
              outline: "2px solid $primary9",
              outlineOffset: "2px",
              borderRadius: "$1",
            },
          }}
        >
          <Flex align="center" gap={1}>
            {expanded ? lessText : moreText}
            {expanded ? lessIcon : moreIcon}
          </Flex>
        </Box>
      )}
    </Box>
  );
};

export default Index;
