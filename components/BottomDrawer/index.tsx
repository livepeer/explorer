import { Sheet, SheetContent } from "@livepeer/design-system";
import { useExplorerStore } from "hooks";
import { useWindowSize } from "react-use";

const Index = ({ children }) => {
  const { width } = useWindowSize();

  const { bottomDrawerOpen, setBottomDrawerOpen } = useExplorerStore();

  return (
    <Sheet
      open={bottomDrawerOpen && width < 1020}
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
        onPointerEnterCapture={undefined}
        onPointerLeaveCapture={undefined}
        placeholder={undefined}
      >
        {children}
      </SheetContent>
    </Sheet>
  );
};

export default Index;
