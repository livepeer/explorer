import { Sheet, SheetContent } from "@livepeer/design-system";
import { useExplorerStore, useIsDesktop } from "hooks";

const Index = ({ children }) => {
  const isDesktop = useIsDesktop();

  const { bottomDrawerOpen, setBottomDrawerOpen } = useExplorerStore();

  return (
    <Sheet
      open={bottomDrawerOpen && !isDesktop}
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
