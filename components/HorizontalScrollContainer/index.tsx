import { Box } from "@livepeer/design-system";
import {
  forwardRef,
  ReactNode,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

type HorizontalScrollContainerProps = {
  children: ReactNode;
  ariaLabel?: string;
  role?: "navigation";
};

const HorizontalScrollContainer = forwardRef<
  HTMLDivElement,
  HorizontalScrollContainerProps
>(({ children, ariaLabel, role }, ref) => {
  const innerRef = useRef<HTMLDivElement | null>(null);
  const [hasOverflow, setHasOverflow] = useState(false);

  useLayoutEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    const updateState = () => {
      const scrollBuffer = 1;
      const overflow = el.scrollWidth > el.clientWidth + scrollBuffer;
      const maxVisibleRight = el.scrollLeft + el.clientWidth;
      setHasOverflow(
        overflow && maxVisibleRight < el.scrollWidth - scrollBuffer
      );
    };
    updateState();
    const observer = new ResizeObserver(updateState);
    observer.observe(el);
    const handleScroll = () => updateState();
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", handleScroll);
      observer.disconnect();
    };
  }, [children]);

  useLayoutEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    const activeTab = el.querySelector(
      '[data-active="true"]'
    ) as HTMLElement | null;
    activeTab?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [children]);

  const setRefs = (node: HTMLDivElement | null) => {
    innerRef.current = node;
    if (typeof ref === "function") {
      ref(node);
    } else if (ref) {
      ref.current = node;
    }
  };

  return (
    <Box
      css={{
        position: "relative",
        borderBottom: "1px solid",
        borderColor: "$neutral6",
      }}
    >
      <Box
        css={{
          display: "flex",
          alignItems: "center",
          width: "100%",
          overflowX: "auto",
          WebkitOverflowScrolling: "touch",
          flexWrap: "nowrap",
        }}
        role={role}
        aria-label={ariaLabel}
        ref={setRefs}
      >
        {children}
      </Box>
      <Box
        css={{
          pointerEvents: "none",
          position: "absolute",
          right: 0,
          top: 0,
          bottom: 0,
          width: "40px",
          background:
            "linear-gradient(90deg, rgba(0,0,0,0) 0%, var(--colors-neutral2) 90%)",
          opacity: hasOverflow ? 1 : 0,
          transition: "opacity 520ms ease-out",
        }}
      />
    </Box>
  );
});

HorizontalScrollContainer.displayName = "HorizontalScrollContainer";

export default HorizontalScrollContainer;
