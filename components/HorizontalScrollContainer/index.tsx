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
  activeItemKey?: string | number;
};

const getTabs = (container: HTMLDivElement) =>
  Array.from(
    container.querySelectorAll<HTMLElement>(
      '[role="tab"], [data-tab], button, a, [data-active="true"]'
    )
  ).filter((node) => container.contains(node));

const scrollActiveTabIntoView = (container: HTMLDivElement) => {
  const activeTab = container.querySelector(
    '[data-active="true"]'
  ) as HTMLElement | null;

  if (!activeTab) return;

  const tabs = getTabs(container);

  if (tabs.length === 0) return;

  const lastTab = tabs[tabs.length - 1];
  const isLastActive = lastTab === activeTab;

  if (isLastActive) {
    const end = container.scrollWidth - container.clientWidth;
    container.scrollLeft = Math.max(0, end);
    return;
  }

  const activeLeft = activeTab.offsetLeft;
  const activeRight = activeLeft + activeTab.offsetWidth;
  const visibleLeft = container.scrollLeft;
  const visibleRight = visibleLeft + container.clientWidth;

  let nextScrollLeft = container.scrollLeft;

  if (activeLeft < visibleLeft) {
    nextScrollLeft = activeLeft;
  } else if (activeRight > visibleRight) {
    nextScrollLeft = activeRight - container.clientWidth;
  }

  const maxScrollLeft = container.scrollWidth - container.clientWidth;
  const clampedScrollLeft = Math.max(
    0,
    Math.min(nextScrollLeft, maxScrollLeft)
  );

  if (Math.abs(clampedScrollLeft - container.scrollLeft) > 1) {
    container.scrollLeft = clampedScrollLeft;
  }
};

const HorizontalScrollContainer = forwardRef<
  HTMLDivElement,
  HorizontalScrollContainerProps
>(({ children, ariaLabel, role, activeItemKey }, ref) => {
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

    const syncActiveTab = () => scrollActiveTabIntoView(el);

    const raf = requestAnimationFrame(syncActiveTab);
    const observer = new ResizeObserver(syncActiveTab);
    observer.observe(el);

    const activeTab = el.querySelector(
      '[data-active="true"]'
    ) as HTMLElement | null;
    if (activeTab) {
      observer.observe(activeTab);
    }

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [activeItemKey]);

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
        "&::after": {
          content: '""',
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          borderBottom: "1px solid $neutral6",
        },
      }}
    >
      <Box
        css={{
          display: "flex",
          alignItems: "center",
          width: "100%",
          overflowX: "auto",
          overflowY: "hidden",
          WebkitOverflowScrolling: "touch",
          flexWrap: "nowrap",
          position: "relative",
          zIndex: 1,
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
