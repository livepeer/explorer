import { Box, keyframes } from "@jjasonn.stone/design-system";
import { Dialog } from "@reach/dialog";
import { useExplorerStore } from "hooks";
import { useWindowSize } from "react-use";

const slideUp = keyframes({
  "0%": { transform: "translate3d(0, 100%, 0)" },
  "100%": { transform: "translate3d(0,0%,0)" },
});

const Index = ({ children }) => {
  const { width } = useWindowSize();

  const { bottomDrawerOpen, setBottomDrawerOpen } = useExplorerStore();

  return (
    <Box
      as={Dialog}
      aria-label="Bottom Drawer"
      isOpen={bottomDrawerOpen && width < 1020}
      css={{
        animation: `${slideUp} 0.3s ease`,
        position: "fixed",
        bottom: 0,
        borderTopRightRadius: 10,
        borderTopLeftRadius: 10,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        maxWidth: "100%",
        width: "100%",
        margin: 0,
        border: 0,
      }}
      onDismiss={() => setBottomDrawerOpen(false)}
    >
      {children}
    </Box>
  );
};

export default Index;
