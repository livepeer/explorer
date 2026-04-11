import { Sheet, SheetContent } from "@livepeer/design-system";
import { useExplorerStore } from "hooks";
import { useWindowSize } from "react-use";

const Index = ({ children }) => {
  const { width } = useWindowSize();

  const { bottomDrawerOpen, setBottomDrawerOpen } = useExplorerStore();

  return (
    <Sheet
      open={bottomDrawerOpen && width < 1200}
      onOpenChange={(open) => {
        if (!open) setBottomDrawerOpen(false);
      }}
    >
      <SheetContent
        side="bottom"
        aria-label="Bottom Drawer"
        css={{
          height: "initial",
          backgroundColor: "transparent",
        }}
      >
        {children}
      </SheetContent>
    </Sheet>
  );
};

export default Index;
