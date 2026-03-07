import { Box } from "@livepeer/design-system";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type SnackbarPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

type SnackbarOptions = {
  position?: SnackbarPosition;
  style?: React.CSSProperties;
  closeStyle?: React.CSSProperties;
};

type SnackbarContextValue = {
  closeSnackbar: () => void;
  openSnackbar: (
    text?: string,
    duration?: number,
    position?: SnackbarPosition,
    style?: React.CSSProperties,
    closeStyle?: React.CSSProperties
  ) => void;
};

const DEFAULT_DURATION = 5000;
const DEFAULT_POSITION: SnackbarPosition = "bottom-center";
const REOPEN_DELAY_MS = 250;
const POSITIONS = new Set<SnackbarPosition>([
  "top-left",
  "top-center",
  "top-right",
  "bottom-left",
  "bottom-center",
  "bottom-right",
]);

const SnackbarContext = createContext<SnackbarContextValue>({
  closeSnackbar: () => {},
  openSnackbar: () => {},
});

type SnackbarState = {
  closeStyle: React.CSSProperties;
  duration: number;
  open: boolean;
  position: SnackbarPosition;
  style: React.CSSProperties;
  text: string;
};

const initialState: SnackbarState = {
  closeStyle: {},
  duration: DEFAULT_DURATION,
  open: false,
  position: DEFAULT_POSITION,
  style: {},
  text: "",
};

const getPositionStyles = (position: SnackbarPosition): React.CSSProperties => {
  const isTop = position.startsWith("top");
  const justifyContent = position.endsWith("left")
    ? "flex-start"
    : position.endsWith("right")
    ? "flex-end"
    : "center";

  return {
    bottom: isTop ? undefined : 8,
    justifyContent,
    left: 0,
    pointerEvents: "none",
    position: "fixed",
    right: 0,
    top: isTop ? 8 : undefined,
    zIndex: 1_000_000,
  };
};

export function SnackbarProvider({ children }: { children?: React.ReactNode }) {
  const [snackbar, setSnackbar] = useState(initialState);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reopenTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (closeTimeoutRef.current !== null) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }

    if (reopenTimeoutRef.current !== null) {
      clearTimeout(reopenTimeoutRef.current);
      reopenTimeoutRef.current = null;
    }
  }, []);

  const closeSnackbar = useCallback(() => {
    clearTimers();
    setSnackbar((current) => ({ ...current, open: false }));
  }, [clearTimers]);

  const triggerSnackbar = useCallback(
    (
      text = "",
      duration = DEFAULT_DURATION,
      position = DEFAULT_POSITION,
      style: React.CSSProperties = {},
      closeStyle: React.CSSProperties = {}
    ) => {
      setSnackbar({
        closeStyle,
        duration,
        open: true,
        position,
        style,
        text,
      });
    },
    []
  );

  const openSnackbar = useCallback(
    (
      text = "",
      duration = DEFAULT_DURATION,
      position = DEFAULT_POSITION,
      style: React.CSSProperties = {},
      closeStyle: React.CSSProperties = {}
    ) => {
      clearTimers();

      if (snackbar.open) {
        setSnackbar((current) => ({ ...current, open: false }));
        reopenTimeoutRef.current = setTimeout(() => {
          triggerSnackbar(text, duration, position, style, closeStyle);
        }, REOPEN_DELAY_MS);
        return;
      }

      triggerSnackbar(text, duration, position, style, closeStyle);
    },
    [clearTimers, snackbar.open, triggerSnackbar]
  );

  useEffect(() => {
    if (!snackbar.open) return;

    closeTimeoutRef.current = setTimeout(() => {
      setSnackbar((current) => ({ ...current, open: false }));
    }, snackbar.duration);

    return () => {
      if (closeTimeoutRef.current !== null) {
        clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
      }
    };
  }, [snackbar.duration, snackbar.open]);

  useEffect(() => clearTimers, [clearTimers]);

  const contextValue = useMemo(
    () => ({
      closeSnackbar,
      openSnackbar,
    }),
    [closeSnackbar, openSnackbar]
  );

  return (
    <SnackbarContext.Provider value={contextValue}>
      {children}
      <Box
        aria-live="polite"
        css={{
          display: "flex",
          marginLeft: "$2",
          marginRight: "$2",
          maxWidth: "calc(100vw - 16px)",
        }}
        style={getPositionStyles(snackbar.position)}
      >
        <Box
          aria-hidden={!snackbar.open}
          css={{
            alignItems: "center",
            backgroundColor: "$panel",
            borderRadius: 4,
            boxShadow:
              "0 3px 5px -1px rgba(0, 0, 0, 0.2), 0 6px 10px 0 rgba(0, 0, 0, 0.14), 0 1px 18px 0 rgba(0, 0, 0, 0.12)",
            color: "$hiContrast",
            display: "flex",
            maxWidth: 672,
            minWidth: 334,
            opacity: snackbar.open ? 1 : 0,
            pointerEvents: snackbar.open ? "auto" : "none",
            transform: snackbar.open ? "translateY(0)" : "translateY(8px)",
            transition: "opacity 150ms ease, transform 150ms ease",
          }}
          style={snackbar.style}
        >
          <Box
            css={{
              flexGrow: 1,
              lineHeight: "20px",
              padding: "14px 16px",
            }}
          >
            {snackbar.text}
          </Box>
          <Box
            as="button"
            type="button"
            aria-label="Close notification"
            onClick={closeSnackbar}
            tabIndex={snackbar.open ? 0 : -1}
            css={{
              alignItems: "center",
              backgroundColor: "transparent",
              border: "none",
              color: "$hiContrast",
              cursor: "pointer",
              display: "flex",
              fontSize: 12,
              height: 36,
              justifyContent: "center",
              marginRight: 8,
              padding: 8,
              width: 36,
            }}
            style={snackbar.closeStyle}
          >
            x
          </Box>
        </Box>
      </Box>
    </SnackbarContext.Provider>
  );
}

export const useSnackbar = ({
  position = DEFAULT_POSITION,
  style = {},
  closeStyle = {},
}: SnackbarOptions = {}) => {
  const { closeSnackbar, openSnackbar } = useContext(SnackbarContext);
  const resolvedPosition = POSITIONS.has(position)
    ? position
    : DEFAULT_POSITION;

  const open = useCallback(
    (text = "", duration = DEFAULT_DURATION) => {
      openSnackbar(text, duration, resolvedPosition, style, closeStyle);
    },
    [closeStyle, openSnackbar, resolvedPosition, style]
  );

  return [open, closeSnackbar] as const;
};
